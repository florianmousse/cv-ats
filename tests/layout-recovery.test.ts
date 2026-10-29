import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getDocumentProxy,extractText} from 'unpdf';
import {layoutCV} from './fixtures/layout-cv';
import {labels,assertGroundedFields,toPlainText} from '../lib/cv';
import {defaultPresentation,templates,presentationSchema} from '../lib/presentation';
import {createCVDocument} from '../lib/pdf';
import {recoverSections} from '../lib/recover-sections';
import {resumeLinkParts,safeResumeURL} from '../lib/resume-links';
import {emptyWorkspace,encodeDraft,decodeDraft} from '../lib/workspace-draft';

const source=`LANGUES
Bilingue Allemand
Anglais niveau B2 (930/990 TOEIC - 2023)
CENTRES D'INTÉRÊTS
Hockey en club pendant 10 ans
Coach et entraîneur
EXPÉRIENCES
Mission qui ne doit pas devenir un loisir
PROJETS PERSONNELS
portfolio.example.test
QUALITÉS
Curieux
Autonome`;
test('explicit missing sections recover verbatim without replacing existing edits or inventing levels',()=>{
 const base={...layoutCV,langues:undefined,interets:undefined,projets:undefined,autresSections:undefined};
 const restored=recoverSections(base,source);
 assert.deepEqual(restored.data.interets,['Hockey en club pendant 10 ans','Coach et entraîneur']);
 assert.equal(restored.data.langues?.[0].langue,'Allemand');assert.equal(restored.data.langues?.[0].niveau,'Bilingue');
 assert.equal(restored.data.projets?.[0].lien,'portfolio.example.test');
 assert.ok(!toPlainText(restored.data).includes('Mission qui'));
 assert.ok(!toPlainText(restored.data).includes('C2'));
 assertGroundedFields(restored.data,toPlainText(layoutCV)+'\n'+source);
 assert.deepEqual(recoverSections({...base,interets:['Course']},source,true).data.interets,['Course']);
 assert.deepEqual(recoverSections({...base,interets:[]},source).data.interets,[]);
 assert.equal(recoverSections(base,'Texte sans rubrique clairement titrée.').recovered.length,0);
});
test('old cache is completed once and later intentional deletions survive reload',()=>{
 const state={...emptyWorkspace(),sectionRecoveryVersion:undefined,source,draft:{kind:'optimize' as const,data:{...layoutCV,interets:[]},headings:labels}};
 const restored=decodeDraft(encodeDraft('a',state,1000),'a',2000)!;
 assert.equal(restored.draft?.data.interets?.length,2);assert.equal(restored.sectionRecoveryVersion,1);
 restored.draft!.data.interets=[];
 assert.deepEqual(decodeDraft(encodeDraft('a',restored,2000),'a',3000)?.draft?.data.interets,[]);
});
test('links keep literal text, support emails and known bare domains, reject unsafe schemes',()=>{
 for(const value of ['javascript:alert(1)','data:text/html,test','file:///C:/secret','https://user:pass@example.test'])assert.equal(safeResumeURL(value),undefined);
 const text='Node.js - portfolio.example.test - https://example.test/projet - camille@example.test';
 const parts=resumeLinkParts(text,['portfolio.example.test']);
 assert.equal(parts.map(p=>p.text).join(''),text);assert.equal(parts.filter(p=>p.url).length,3);
 assert.equal(resumeLinkParts('Node.js')[0].url,undefined);
});
test('all six templates export real links and report the exact PDF page count',async()=>{
 const realFetch=globalThis.fetch;
 globalThis.fetch=(async(url,...args)=>String(url)==='/fonts/serif-vfs.json'?Response.json(JSON.parse(await readFile(new URL('../public/fonts/serif-vfs.json',import.meta.url),'utf8'))):realFetch(url,...args)) as typeof fetch;
 try{for(const template of templates){
  const {blob,pages}=await createCVDocument(layoutCV,template.id,labels,{...defaultPresentation,template:template.id});
  const doc=await getDocumentProxy(new Uint8Array(await blob.arrayBuffer()));
  assert.equal(pages,doc.numPages,template.name);
  const urls:string[]=[];for(let i=1;i<=doc.numPages;i++){const annotations=await (await doc.getPage(i)).getAnnotations();for(const a of annotations)if(a.url)urls.push(a.url);}
  assert.ok(urls.includes('https://portfolio.example.test/'));assert.ok(urls.includes('https://example.test/projet'));assert.ok(urls.includes('mailto:camille@example.test'));assert.ok(!urls.includes('https://node.js/'));
  const extracted=await extractText(doc,{mergePages:true});for(const value of ['Camille Exemple','Hockey','Engagements','TOEIC','Développement logiciel 4'])assert.ok(extracted.text.toLowerCase().includes(value.toLowerCase()),`${template.name}: ${value}`);
  await doc.loadingTask.destroy();
 }}finally{globalThis.fetch=realFetch;}
});
test('fit settings reduce pagination without removing text and remain bounded',async()=>{
 const large=await createCVDocument(layoutCV,'modern',labels,{...defaultPresentation,fontSize:11});
 const small=await createCVDocument(layoutCV,'modern',labels,{...defaultPresentation,fontSize:9,density:'compact',margins:'narrow'});
 assert.ok(large.pages>1);assert.ok(small.pages<large.pages);
 const text=(await extractText(new Uint8Array(await small.blob.arrayBuffer()),{mergePages:true})).text;
 assert.ok(text.includes('Développement logiciel 4'));assert.ok(text.includes('Encadrement bénévole'));
 const editorial=await createCVDocument(layoutCV,'minimal',labels,{...defaultPresentation,template:'minimal',fontSize:9,density:'compact'});
 assert.equal(editorial.pages,1,'No blank page caused by a final paragraph margin');
 assert.equal(presentationSchema.safeParse({...defaultPresentation,fontSize:8}).success,false);
});
