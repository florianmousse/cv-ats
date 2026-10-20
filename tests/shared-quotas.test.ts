import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';

test('shared quotas: migration, reservations, overrides, periods, personal exemption and permissions',async()=>{
 const db=new PGlite();const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
 const query=async<T>(sql:string,args:unknown[]=[])=> (await db.query<T>(sql,args)).rows;
 const run=async(user=a,mode='scan',source='shared')=>(await query<{id:string}>('select cvats_admit_run($1,$2,$3,$4) as id',[user,mode,'gemini-test',source]))[0].id;
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
   create table auth.users(id uuid primary key,raw_app_meta_data jsonb);
   create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
   create function auth.jwt() returns jsonb language sql stable as $$ select '{}'::jsonb $$;`);
  for(const file of ['001_saves_and_quotas.sql','002_personal_keys_no_quotas.sql','003_shared_key_quotas.sql'])await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  await query('insert into auth.users values($1,$3),($2,$3)',[a,b,JSON.stringify({cvats:true,enabled:true,cvats_role:'member'})]);
  await db.exec('set role service_role');
  await query('select cvats_set_shared_policy(4,3)');
  const opt=await run(a,'optimize');
  await assert.rejects(run(a,'optimize'),/CVATS_USER_QUOTA/);
  // An unused second call is released on finish, an attempted call is charged.
  await query('select cvats_start_call($1)',[opt]);await query('select cvats_finish($1,false)',[opt]);
  await run(a,'optimize');
  await assert.rejects(run(),/CVATS_USER_QUOTA/);
  await run(b);
  await assert.rejects(run(b),/CVATS_GLOBAL_QUOTA/);
  // Personal requests never consume the global or per-account shared budget.
  await run(a,'optimize','personal');await run(b,'scan','personal');
  await query('select cvats_set_shared_policy(0,0)');
  await run(a,'optimize','personal');
  await assert.rejects(run(),/CVATS_USER_QUOTA/);
  await query('select cvats_set_quota($1,20)',[a]);
  await assert.rejects(run(),/CVATS_GLOBAL_QUOTA/);
  await query('select cvats_set_shared_policy(100,0)');
  await run();
  await query('select cvats_set_quota($1,null)',[a]);
  await assert.rejects(run(),/CVATS_USER_QUOTA/);
  // Legacy entry points cannot bypass restored quotas.
  await assert.rejects(query('select cvats_reserve($1,$2,$3)',[a,'scan','gemini-test']),/CVATS_USER_QUOTA/);
  await query('select cvats_set_shared_policy(100,5)');
  const concurrent=await Promise.allSettled([run(),run()]);
  assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);
  const [{v:users}]=await query<{v:Array<{userId:string;quota:{used:number;limit:number;dailyUsed:number;override:number|null}}>}>('select cvats_user_usage($1) as v',[[a,b]]);
  const own=users.find(u=>u.userId===a)!;assert.equal(own.quota.used,5);assert.equal(own.quota.limit,5);assert.equal(own.quota.dailyUsed,6);assert.equal(own.quota.override,null);
  await assert.rejects(query('select cvats_set_shared_policy(-1,1)'),/CVATS_INVALID/);
  await assert.rejects(query('select cvats_set_quota($1,-1)',[a]),/CVATS_INVALID/);
  await db.exec('reset role');
  // Prior months/days no longer count, without deleting historical statistics.
  await query("update cvats_usage_runs set budget_month=(date_trunc('month',now() at time zone 'UTC')-interval '1 month')::date,created_at=now()-interval '32 days'");
  await db.exec('set role service_role');await run();
  await db.exec('reset role');
  // Re-running 003 preserves configured limits, custom overrides and usage.
  await query('select cvats_set_quota($1,12)',[b]);
  await db.exec(await readFile(new URL('../supabase/migrations/003_shared_key_quotas.sql',import.meta.url),'utf8'));
  const [{v:allowance}]=await query<{v:{limit:number;dailyLimit:number;used:number}}>('select cvats_shared_allowance($1) as v',[b]);assert.equal(allowance.limit,12);assert.equal(allowance.dailyLimit,100);
  for(const role of ['anon','authenticated']){
   await db.exec('set role '+role);
   await assert.rejects(run(),/permission denied/);
   await assert.rejects(query('select cvats_set_shared_policy(100,100)'),/permission denied/);
   await assert.rejects(query('select cvats_set_quota($1,100)',[a]),/permission denied/);
   await assert.rejects(query('select * from cvats_shared_policy'),/permission denied/);
   await db.exec('reset role');
  }
  await query("update auth.users set raw_app_meta_data=jsonb_set(raw_app_meta_data,'{enabled}','false') where id=$1",[a]);
  await assert.rejects(run(a,'scan','personal'),/CVATS_FORBIDDEN/);
 }finally{await db.close();}
});
