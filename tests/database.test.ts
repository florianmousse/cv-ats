import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

// Real PostgreSQL engine, isolated memory database; only Supabase auth primitives
// are stubbed. No account, CV, API key or cloud database is used by these tests.
test('Migration: RLS isolation, revoked sessions, quota accounting and server-only RPCs',async()=>{
 const db=new PGlite();
 const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 const meta={cvats:true,enabled:true,cvats_role:'member',access_version:'v1',must_change_password:false};
 const query=async<T>(sql:string,args:unknown[]=[])=> (await db.query<T>(sql,args)).rows;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
   create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
   grant usage on schema auth to authenticated,service_role;
   grant execute on all functions in schema auth to authenticated,service_role;`);
  const sql=await readFile(new URL('../supabase/migrations/001_saves_and_quotas.sql',import.meta.url),'utf8');
  await db.exec(sql);await db.exec(sql); // safe re-run leaves existing data intact
  await query('insert into auth.users values ($1,$3),($2,$3)',[a,b,JSON.stringify(meta)]);
  const login=async(id:string,version='v1')=>{await query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[id,JSON.stringify({app_metadata:{access_version:version}})]);await db.exec('set role authenticated');};
  await login(a);
  const [saved]=await query<{id:string}>('select public.cvats_save_cv($1,$2,$3,$4) as id',['Mon CV','Expérience vérifiée et coordonnées du candidat.','',null]);
  assert.equal((await query('select * from public.cvats_saved_cvs')).length,1);
  await assert.rejects(query('select public.cvats_reserve($1,$2,$3)',[a,'scan','gemini-test']),/permission denied/);
  await assert.rejects(query('select * from public.cvats_user_quotas'),/permission denied/);
  await db.exec('reset role');await login(b);
  assert.equal((await query('select * from public.cvats_saved_cvs')).length,0);
  assert.equal((await query('delete from public.cvats_saved_cvs where id=$1 returning id',[saved.id])).length,0);
  await db.exec('reset role');await login(a,'revoked');
  assert.equal((await query('select * from public.cvats_saved_cvs')).length,0);
  await assert.rejects(query('select public.cvats_save_cv($1,$2,$3,$4)',['CV','Expérience vérifiée et coordonnées du candidat.','',null]),/CVATS_FORBIDDEN/);
  await db.exec('reset role');await login(a);
  for(let i=1;i<20;i++)await query('select public.cvats_save_cv($1,$2,$3,$4)',['Version '+i,'Expérience vérifiée et coordonnées du candidat.','',null]);
  await assert.rejects(query('select public.cvats_save_cv($1,$2,$3,$4)',['Trop','Expérience vérifiée et coordonnées du candidat.','',null]),/CVATS_SAVE_LIMIT/);
  await db.exec('reset role');await db.exec('set role service_role');
  await query('select public.cvats_set_quota($1,2)',[a]);
  const [{id:run}]=await query<{id:string}>('select public.cvats_reserve($1,$2,$3) as id',[a,'optimize','gemini-test']);
  await assert.rejects(query('select public.cvats_reserve($1,$2,$3)',[a,'scan','gemini-test']),/CVATS_USER_QUOTA/);
  await query('select public.cvats_start_call($1)',[run]);
  await query('select public.cvats_record_call($1,1,200,100,20,10,130)',[run]);
  await query('select public.cvats_record_call($1,1,200,900,900,900,2700)',[run]); // duplicate cannot inflate totals
  await query('select public.cvats_finish($1,false)',[run]); // unused audit slot released
  await query('select public.cvats_finish($1,true)',[run]); // idempotent
  const [{v:usage}]=await query<{v:Array<{used:number;tokens:number}>}>('select public.cvats_user_usage($1) as v',[[a]]);
  assert.equal(usage[0].used,1);assert.equal(usage[0].tokens,130);
  await assert.rejects(query('select public.cvats_start_call($1)',[run]),/CVATS_INVALID/);
  const [{id:run2}]=await query<{id:string}>('select public.cvats_reserve($1,$2,$3) as id',[a,'scan','gemini-test']);
  await query('select public.cvats_start_call($1)',[run2]);
  await query('select public.cvats_finish($1,false)',[run2]); // failed attempt still counts
  await assert.rejects(query('select public.cvats_reserve($1,$2,$3)',[a,'scan','gemini-test']),/CVATS_USER_QUOTA/);
  await query('update public.cvats_quota_settings set daily_limit=2');
  await assert.rejects(query('select public.cvats_reserve($1,$2,$3)',[b,'scan','gemini-test']),/CVATS_GLOBAL_QUOTA/);
  const [{v:stats}]=await query<{v:{dailyUsed:number;models:Array<{unknown:number}>}}>('select public.cvats_admin_usage() as v');
  assert.equal(stats.dailyUsed,2);assert.equal(stats.models[0].unknown,1);
  await query('update public.cvats_quota_settings set daily_limit=100');
  await query('select public.cvats_set_quota($1,2)',[b]);
  const concurrent=await Promise.allSettled(Array.from({length:8},()=>query('select public.cvats_reserve($1,$2,$3)',[b,'scan','gemini-test'])));
  assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,2);
  assert.equal(concurrent.filter(r=>r.status==='rejected').length,6);
  const [{v:pending}]=await query<{v:Array<{used:number;attempted:number}>}>('select public.cvats_user_usage($1) as v',[[b]]);
  assert.equal(pending[0].used,2);assert.equal(pending[0].attempted,0); // crash reservations remain charged
  await query("update public.cvats_usage_runs set budget_month=budget_month-interval '1 month',budget_day=budget_day-1,created_at=created_at-interval '2 minutes' where user_id=$1",[b]);
  const [{v:rolled}]=await query<{v:Array<{used:number}>}>('select public.cvats_user_usage($1) as v',[[b]]);assert.equal(rolled[0].used,0);
  await query('select public.cvats_set_quota($1,100)',[b]);
  for(let i=0;i<6;i++)await query('select public.cvats_reserve($1,$2,$3)',[b,'scan','gemini-test']);
  await assert.rejects(query('select public.cvats_reserve($1,$2,$3)',[b,'scan','gemini-test']),/CVATS_RATE_LIMIT/);
  await db.exec('reset role');
  await query("update auth.users set raw_app_meta_data=jsonb_set(raw_app_meta_data,'{enabled}','false') where id=$1",[a]);
  await login(a);assert.equal((await query('select * from public.cvats_saved_cvs')).length,0);
  await db.exec('reset role');await query('delete from auth.users where id=$1',[a]);
  assert.equal((await query('select * from public.cvats_saved_cvs')).length,0);
  const [{v:after}]=await query<{v:{dailyUsed:number}}>('select public.cvats_admin_usage() as v');assert.equal(after.dailyUsed,8);
 }finally{await db.close();}
});
