import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GET as saves,POST as save} from '../app/api/cvs/route';
import {GET as load,DELETE as remove} from '../app/api/cvs/[id]/route';
import {GET as usage} from '../app/api/usage/route';
import {GET as dashboard,PATCH as budget} from '../app/api/admin/usage/route';
import {PATCH as quota} from '../app/api/admin/users/[id]/quota/route';
import {POST as analyze} from '../app/api/analyze/route';
import {meteredFetch} from '../lib/data/usage';
import {cookieName} from '../lib/auth/session';
const origin='https://cv-ats.example';const userId='00000000-0000-4000-8000-000000000001';const id='00000000-0000-4000-8000-000000000002';
const metadata={cvats:true,enabled:true,cvats_role:'member',must_change_password:false,access_version:'v1'};
const token='header.'+Buffer.from(JSON.stringify({app_metadata:metadata})).toString('base64url')+'.signature';
const ctx={params:Promise.resolve({id})};
const request=(path:string,method='GET',body?:unknown,auth=true)=>new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(auth?{Cookie:cookieName()+'='+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function isolated(fn:()=>Promise<void>){const old=globalThis.fetch;const keys=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','GEMINI_API_KEY'];const prev=keys.map(k=>process.env[k]);Object.assign(process.env,{SUPABASE_URL:'https://auth.example.test',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',GEMINI_API_KEY:'test-key'});try{await fn();}finally{globalThis.fetch=old;keys.forEach((k,i)=>{if(prev[i]===undefined)delete process.env[k];else process.env[k]=prev[i];});}}
const authResponse=()=>Response.json({id:userId,email:'test@example.com',app_metadata:metadata});

test('New endpoints deny anonymous users and members cannot edit quotas',()=>isolated(async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return authResponse();};
 assert.equal((await saves(request('/api/cvs','GET',undefined,false))).status,401);
 assert.equal((await save(request('/api/cvs','POST',{},false))).status,401);
 assert.equal((await load(request('/api/cvs/'+id,'GET',undefined,false),ctx)).status,401);
 assert.equal((await remove(request('/api/cvs/'+id,'DELETE',undefined,false),ctx)).status,401);
 assert.equal((await usage(request('/api/usage','GET',undefined,false))).status,401);
 assert.equal((await dashboard(request('/api/admin/usage','GET',undefined,false))).status,401);
 assert.equal(calls,0);
 assert.equal((await dashboard(request('/api/admin/usage'))).status,403);
 assert.equal((await budget(request('/api/admin/usage','PATCH',{limit:900}))).status,403);
 assert.equal((await quota(request('/api/admin/users/'+id+'/quota','PATCH',{limit:900}),ctx)).status,403);
 assert.equal(calls,3);
}));

test('Saved CV operations use the user JWT and cannot change owner',()=>isolated(async()=>{
 let writes=0;
 globalThis.fetch=async(input,init)=>{
  const url=new URL(String(input));if(url.pathname==='/auth/v1/user')return authResponse();
  const headers=new Headers(init?.headers);assert.equal(headers.get('authorization'),'Bearer '+token);assert.equal(headers.get('apikey'),'test-anon');
  if(url.pathname.endsWith('/rpc/cvats_save_cv')){writes++;const body=JSON.parse(String(init?.body));assert.equal(body.p_name,'Version');assert.equal(body.p_job,'');assert.equal(body.p_result,null);assert.equal(body.p_user,undefined);return Response.json(id);}
  assert.equal(url.searchParams.get('user_id'),'eq.'+userId);
  if(url.searchParams.get('id'))return Response.json(init?.method==='DELETE'?[]:null);
  return Response.json([{id,name:'Version',created_at:new Date().toISOString()}]);
 };
 assert.equal((await saves(request('/api/cvs'))).status,200);
 const payload={name:'Version',cv:'Expérience professionnelle et compétences vérifiées.'};
 assert.equal((await save(request('/api/cvs','POST',payload))).status,201);
 assert.equal((await save(request('/api/cvs','POST',{...payload,user_id:id}))).status,400);
 assert.equal(writes,1);
 assert.equal((await load(request('/api/cvs/'+id),ctx)).status,404);
 assert.equal((await remove(request('/api/cvs/'+id,'DELETE'),ctx)).status,404);
}));

test('Quota denial and unavailable accounting prevent every Gemini call',()=>isolated(async()=>{
 for(const [message,code] of [['CVATS_USER_QUOTA',429],['CVATS_GLOBAL_QUOTA',429],['CVATS_RATE_LIMIT',429],['function does not exist',503]] as const){
  let calls=0;globalThis.fetch=async(input)=>{const url=String(input);if(url.endsWith('/auth/v1/user'))return authResponse();if(url.endsWith('/rpc/cvats_reserve'))return Response.json({message,code:'P0001'},{status:400});calls++;throw new Error('No provider call permitted');};
  const r=await analyze(request('/api/analyze','POST',{mode:'scan',cv:'Expérience professionnelle et compétences vérifiées.',job:''}));assert.equal(r.status,code);assert.equal(calls,0);
 }
}));

test('Metering records Gemini metadata, unknown tokens and failed requests once',()=>isolated(async()=>{
 const events:string[]=[];const reports:Array<Record<string,unknown>>=[];
 globalThis.fetch=async(input,init)=>{const name=String(input).split('/').at(-1)!;events.push(name);if(name==='cvats_start_call')return Response.json(1);assert.equal(name,'cvats_record_call');reports.push(JSON.parse(String(init?.body)));return Response.json(null);};
 const provider=(async()=>{events.push('provider');return Response.json({usageMetadata:{promptTokenCount:100,candidatesTokenCount:20,thoughtsTokenCount:5,totalTokenCount:125},candidates:[]});}) as typeof fetch;
 const r=await meteredFetch(id,provider)('https://gemini.example');assert.equal(r.status,200);
 assert.deepEqual(events,['cvats_start_call','provider','cvats_record_call']);assert.equal(reports[0].p_total,125);assert.equal(reports[0].p_thought,5);
 await meteredFetch(id,async()=>new Response('upstream error',{status:429}))('https://gemini.example');assert.equal(reports[1].p_total,null);assert.equal(reports[1].p_status,429);
 await assert.rejects(meteredFetch(id,async()=>{throw new Error('network');})('https://gemini.example'),/network/);assert.equal(reports[2].p_status,null);assert.equal(reports.length,3);
}));
