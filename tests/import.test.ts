import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Document,Packer,Paragraph} from 'docx';
import {POST} from '../app/api/import/route';
import {cookieName} from '../lib/auth/session';
import {verifyImportProof} from '../lib/import-proof';

test('real PDF/DOCX extraction attests pages only when measurable and rejects empty text',async()=>{
 const previous={url:process.env.SUPABASE_URL,anon:process.env.SUPABASE_ANON_KEY,service:process.env.SUPABASE_SERVICE_ROLE_KEY,fetch:globalThis.fetch};
 process.env.SUPABASE_URL='https://auth.example.test';process.env.SUPABASE_ANON_KEY='test-anon';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';
 const metadata={cvats:true,cvats_role:'member',enabled:true,access_version:'v1'};
 const owner='00000000-0000-4000-8000-000000000001';
 const token='header.'+Buffer.from(JSON.stringify({app_metadata:metadata})).toString('base64url')+'.signature';
 globalThis.fetch=(async(url)=>{assert.equal(new URL(String(url)).pathname,'/auth/v1/user');return Response.json({id:owner,email:'example@example.com',app_metadata:metadata});}) as typeof fetch;
 const upload=(blob:Blob,name:string)=>{const body=new FormData();body.append('file',blob,name);return POST(new Request('https://cv.example.test/api/import',{method:'POST',headers:{Origin:'https://cv.example.test',Cookie:cookieName()+'='+token},body}));};
 try{
  const [{default:pdfMake},{default:fonts}]=await Promise.all([import('pdfmake/build/pdfmake'),import('pdfmake/build/vfs_fonts')]);
  pdfMake.addVirtualFileSystem(fonts);
  const blob=await pdfMake.createPdf({content:[{text:'Camille Exemple — Développement des applications web'},{canvas:[{type:'rect',x:0,y:0,w:30,h:30,color:'#000000'}],pageBreak:'before'}]}).getBlob();
  const response=await upload(blob,'example.pdf');assert.equal(response.status,200);
  const body=await response.json();assert.match(body.text,/Camille Exemple/);
  const facts=verifyImportProof(body.importProof,owner,body.text);
  assert.equal(facts?.format,'pdf');if(facts?.format!=='pdf')throw new Error('Missing PDF facts');
  assert.equal(facts.pages,2);assert.ok(facts.charactersPerPage[0]>0);assert.equal(facts.charactersPerPage[1],0);
  const blank=await pdfMake.createPdf({content:[{canvas:[{type:'rect',x:0,y:0,w:30,h:30,color:'#000000'}]}]}).getBlob();
  const rejected=await upload(blank,'blank.pdf');assert.equal(rejected.status,422);assert.match((await rejected.json()).error,/OCR/);
  const docx=await Packer.toBlob(new Document({sections:[{children:[new Paragraph('Camille Exemple — Développement des applications web')]}]}));
  const word=await upload(docx,'example.docx');assert.equal(word.status,200);
  const wordBody=await word.json();assert.deepEqual(verifyImportProof(wordBody.importProof,owner,wordBody.text),{format:'docx'});
 }finally{
  globalThis.fetch=previous.fetch;
  for(const [key,value] of [['SUPABASE_URL',previous.url],['SUPABASE_ANON_KEY',previous.anon],['SUPABASE_SERVICE_ROLE_KEY',previous.service]]){if(value===undefined)delete process.env[key!];else process.env[key!]=value;}
 }
});
