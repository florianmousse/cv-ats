import {test} from 'node:test';
import assert from 'node:assert/strict';
import {encryptKey,decryptKey,encryptionConfigured} from '../lib/keys/crypto';
import {GET,PUT,DELETE} from '../app/api/account/gemini/route';
import {POST as analyze} from '../app/api/analyze/route';
import {cookieName} from '../lib/auth/session';
import {labels,toPlainText} from '../lib/cv';
const origin='https://cv-ats.example';
const userId='00000000-0000-4000-8000-000000000001';
const metadata={cvats:true,enabled:true,cvats_role:'member',must_change_password:false,access_version:'v1'};
const token='header.'+Buffer.from(JSON.stringify({app_metadata:metadata})).toString('base64url')+'.signature';
const personalKey='personal-test-key-not-a-real-secret';
const fixture={nom:'Élodie Exemple',titre:'Développeuse',contact:{ville:'Rennes',telephone:'',email:'',portfolio:''},profil:'Développement React.',experiences:[],competences:['React'],formation:[]};
const request=(method:string,body?:unknown,authenticated=true,requestOrigin=origin)=>new Request(origin+'/api/account/gemini',{method,headers:{Origin:requestOrigin,'Content-Type':'application/json',...(authenticated?{Cookie:cookieName()+'='+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
async function isolated(fn:()=>Promise<void>){const old=globalThis.fetch;const keys=['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','GEMINI_API_KEY','GEMINI_MODEL','API_KEY_ENCRYPTION_SECRET'];const prev=keys.map(k=>process.env[k]);Object.assign(process.env,{SUPABASE_URL:'https://auth.example.test',SUPABASE_ANON_KEY:'test-anon',SUPABASE_SERVICE_ROLE_KEY:'test-service',GEMINI_API_KEY:'shared-test-key',GEMINI_MODEL:'gemini-test',API_KEY_ENCRYPTION_SECRET:Buffer.alloc(32,3).toString('base64')});try{await fn();}finally{globalThis.fetch=old;keys.forEach((k,i)=>{if(prev[i]===undefined)delete process.env[k];else process.env[k]=prev[i];});}}
const auth=()=>Response.json({id:userId,email:'test@example.com',app_metadata:metadata});
const answer=(data:unknown)=>Response.json({usageMetadata:{promptTokenCount:100,candidatesTokenCount:10,totalTokenCount:110},candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]});

test('Personal keys: authenticated encryption, random nonce and user binding',()=>isolated(async()=>{
 const a=encryptKey(personalKey,userId),b=encryptKey(personalKey,userId);assert.notEqual(a,b);assert.ok(!a.includes(personalKey));assert.equal(decryptKey(a,userId),personalKey);
 assert.throws(()=>decryptKey(a,'another-user'),/déchiffrée/);
 const parts=a.split('.');parts[2]=Buffer.alloc(16).toString('base64');assert.throws(()=>decryptKey(parts.join('.'),userId),/déchiffrée/);
 process.env.API_KEY_ENCRYPTION_SECRET=Buffer.alloc(32,7).toString('base64');assert.throws(()=>decryptKey(a,userId),/déchiffrée/);
 delete process.env.API_KEY_ENCRYPTION_SECRET;assert.equal(encryptionConfigured(),false);assert.throws(()=>encryptKey(personalKey,userId),/chiffrement/);
}));

test('Personal key API enforces owner, CSRF and never returns plaintext/ciphertext',()=>isolated(async()=>{
 let writes=0,deletes=0;let encrypted='';
 globalThis.fetch=async(input,init)=>{const url=new URL(String(input));if(url.pathname==='/auth/v1/user')return auth();
  assert.equal(url.pathname,'/rest/v1/cvats_personal_keys');assert.equal(new Headers(init?.headers).get('apikey'),'test-service');
  if(init?.method==='POST'){writes++;const body=JSON.parse(String(init.body));assert.equal(body.user_id,userId);assert.ok(!String(init.body).includes(personalKey));encrypted=body.encrypted_key;assert.equal(decryptKey(encrypted,userId),personalKey);return new Response(null,{status:201});}
  assert.equal(url.searchParams.get('user_id'),'eq.'+userId);
  if(init?.method==='DELETE'){deletes++;return new Response(null,{status:204});}
  assert.equal(url.searchParams.get('select'),'key_hint,model,updated_at');return Response.json({key_hint:personalKey.slice(-4),model:'gemini-test',updated_at:'2026-09-29T00:00:00Z'});
 };
 for(const method of ['GET','PUT','DELETE']){const response=await (method==='GET'?GET:method==='PUT'?PUT:DELETE)(request(method,method==='PUT'?{apiKey:personalKey}:undefined,false));assert.equal(response.status,401);}
 assert.equal((await PUT(request('PUT',{apiKey:personalKey},true,'https://evil.example'))).status,403);
 assert.equal((await PUT(request('PUT',{apiKey:personalKey,user_id:'other'}))).status,400);
 const saved=await PUT(request('PUT',{apiKey:personalKey,model:'gemini-test'}));assert.equal(saved.status,200);assert.equal(writes,1);assert.deepEqual(await saved.json(),{ok:true});
 const response=await GET(request('GET'));const body=await response.text();assert.equal(response.status,200);assert.ok(!body.includes(personalKey));assert.ok(!body.includes(encrypted));assert.equal(JSON.parse(body).settings.hasPersonalKey,true);
 assert.equal((await DELETE(request('DELETE'))).status,200);assert.equal(deletes,1);
}));

test('Analysis: personal key and model used for BOTH generation and audit, no shared key required',()=>isolated(async()=>{
 delete process.env.GEMINI_API_KEY;
 let calls=0,ordinal=0;const sources:string[]=[];
 globalThis.fetch=async(input,init)=>{const url=String(input);
  if(url.endsWith('/auth/v1/user'))return auth();
  if(url.includes('/cvats_personal_keys'))return Response.json({encrypted_key:encryptKey(personalKey,userId),model:'gemini-personal-test'});
  if(url.includes('/rpc/')){const args=JSON.parse(String(init?.body));if(url.endsWith('cvats_begin_run')){sources.push(args.p_source);assert.equal(args.p_model,'gemini-personal-test');return Response.json(userId);}if(url.endsWith('cvats_start_call'))return Response.json(++ordinal);return Response.json(null);}
  assert.ok(url.includes('gemini-personal-test:generateContent'));assert.equal(new Headers(init?.headers).get('x-goog-api-key'),personalKey);assert.ok(!url.includes(personalKey));calls++;
  return answer(calls===1?fixture:{fidele:true,titres:labels});
 };
 const r=await analyze(request('POST',{mode:'optimize',cv:toPlainText(fixture),job:'Développeuse React pour développer des applications web.'}));assert.equal(r.status,200);assert.equal(calls,2);assert.deepEqual(sources,['personal']);assert.equal((await r.json()).keySource,'personal');
}));

test('Personal failures never fall back to the site key; shared key used only when absent',()=>isolated(async()=>{
 for(const status of [400,403,404,429,503]){
  let calls=0;
  globalThis.fetch=async(input,init)=>{const url=String(input);if(url.endsWith('/auth/v1/user'))return auth();if(url.includes('/cvats_personal_keys'))return Response.json({encrypted_key:encryptKey(personalKey,userId),model:''});if(url.includes('/rpc/'))return Response.json(url.endsWith('cvats_begin_run')?userId:url.endsWith('cvats_start_call')?1:null);
   calls++;assert.equal(new Headers(init?.headers).get('x-goog-api-key'),personalKey);return Response.json({error:{message:'upstream '+personalKey}},{status});};
  const r=await analyze(request('POST',{mode:'scan',cv:toPlainText(fixture),job:''}));assert.ok(r.status>=400);assert.equal(calls,1);assert.ok(!(await r.text()).includes(personalKey));
 }
 let calls=0;globalThis.fetch=async(input)=>{const url=String(input);if(url.endsWith('/auth/v1/user'))return auth();if(url.includes('/cvats_personal_keys'))return Response.json({encrypted_key:'unreadable',model:''});calls++;throw new Error('No call allowed');};
 assert.equal((await analyze(request('POST',{mode:'scan',cv:toPlainText(fixture),job:''}))).status,503);assert.equal(calls,0);
 globalThis.fetch=async(input,init)=>{const url=String(input);if(url.endsWith('/auth/v1/user'))return auth();if(url.includes('/cvats_personal_keys'))return Response.json(null);if(url.includes('/rpc/')){if(url.endsWith('cvats_begin_run')){assert.equal(JSON.parse(String(init?.body)).p_source,'shared');return Response.json(userId);}return Response.json(url.endsWith('cvats_start_call')?1:null);}calls++;assert.equal(new Headers(init?.headers).get('x-goog-api-key'),'shared-test-key');return answer({score:75,pointsForts:[],problemes:[],motsClesManquants:[],recommandations:[]});};
 assert.equal((await analyze(request('POST',{mode:'scan',cv:toPlainText(fixture),job:''}))).status,200);assert.equal(calls,1);
}));
