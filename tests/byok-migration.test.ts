import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('Migration 002: no quotas even with old zero limits, private keys isolated, consumption split',async()=>{
 const db=new PGlite();const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 const query=async<T>(sql:string,args:unknown[]=[])=> (await db.query<T>(sql,args)).rows;
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create function auth.jwt() returns jsonb language sql stable as $$ select nullif(current_setting('request.jwt.claims',true),'')::jsonb $$;
 grant usage on schema auth to authenticated,service_role;grant execute on all functions in schema auth to authenticated,service_role;`);
 await db.exec(await readFile(new URL('../supabase/migrations/001_saves_and_quotas.sql',import.meta.url),'utf8'));
 await query('insert into auth.users values ($1,$3),($2,$3)',[a,b,JSON.stringify({cvats:true,enabled:true,cvats_role:'member',access_version:'v1'})]);
 await query('select cvats_set_quota($1,0)',[a]);await query('update cvats_quota_settings set daily_limit=0');
 const migration=await readFile(new URL('../supabase/migrations/002_personal_keys_no_quotas.sql',import.meta.url),'utf8');await db.exec(migration);await db.exec(migration);
 await query('insert into cvats_personal_keys(user_id,encrypted_key,key_hint) values($1,$2,$3)',[a,'ciphertext-only-placeholder-at-least-thirty-chars','abcd']);
 await query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[a,JSON.stringify({app_metadata:{access_version:'v1'}})]);
 await db.exec('set role authenticated');
 await assert.rejects(query('select * from cvats_personal_keys'),/permission denied/);
 await assert.rejects(query('delete from cvats_personal_keys where user_id=$1',[a]),/permission denied/);
 await assert.rejects(query('select cvats_begin_run($1,$2,$3,$4)',[a,'scan','gemini-test','personal']),/permission denied/);
 await db.exec('reset role');await db.exec('set role service_role');
 await assert.rejects(query('select cvats_set_quota($1,100)',[a]),/permission denied/);
 await assert.rejects(query('update cvats_quota_settings set daily_limit=100'),/permission denied/);
 // Exceed every former allowance, within one minute, for both key sources.
 for(const source of ['personal','shared'])for(let i=0;i<105;i++){
  const [{id}]=await query<{id:string}>('select cvats_begin_run($1,$2,$3,$4) as id',[a,'scan','gemini-test',source]);
  await query('select cvats_start_call($1)',[id]);await query('select cvats_record_call($1,1,200,10,2,0,12)',[id]);await query('select cvats_finish($1,true)',[id]);
 }
 // Compatibility path used by pre-1.3 deployments also has no cap.
 await query('select cvats_reserve($1,$2,$3)',[a,'optimize','gemini-test']);
 const [{v:usage}]=await query<{v:Array<{attempted:number;sharedCalls:number;personalCalls:number;hasPersonalKey:boolean;tokens:number;limit?:number}>}>('select cvats_user_usage($1) as v',[[a,b]]);
 const own=usage.find(u=>u.hasPersonalKey)!;assert.equal(own.attempted,210);assert.equal(own.sharedCalls,105);assert.equal(own.personalCalls,105);assert.equal(own.tokens,2520);assert.equal(own.limit,undefined);
 const [{v:stats}]=await query<{v:{models:Array<{source:string;attempted:number;tokens:number}>;dailyLimit?:number}}>('select cvats_admin_usage() as v');
 assert.equal(stats.dailyLimit,undefined);assert.equal(stats.models.length,2);for(const m of stats.models){assert.equal(m.attempted,105);assert.equal(m.tokens,1260);}
 await db.exec('reset role');await query("update auth.users set raw_app_meta_data=jsonb_set(raw_app_meta_data,'{enabled}','false') where id=$1",[a]);await db.exec('set role service_role');
 await assert.rejects(query('select cvats_begin_run($1,$2,$3,$4)',[a,'scan','gemini-test','personal']),/CVATS_FORBIDDEN/);
 await db.exec('reset role');await query('delete from auth.users where id=$1',[a]);assert.equal((await query('select * from cvats_personal_keys')).length,0);
 const [{v:after}]=await query<{v:{models:Array<{attempted:number}>}}>('select cvats_admin_usage() as v');assert.equal(after.models.reduce((sum,m)=>sum+m.attempted,0),210);
 }finally{await db.close();}
});
