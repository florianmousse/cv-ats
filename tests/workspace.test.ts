import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CACHE_TTL,cacheKey,currentCV,decodeDraft,emptyWorkspace,encodeDraft,isScanStale} from '../lib/workspace-draft';
import {labels,type Scan} from '../lib/cv';
import {externalPrompt} from '../lib/candidature-prompts';
import {anglicisms} from '../lib/anglicisms';
import {enrichScan} from '../lib/diagnostic';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
import ScanReport from '../components/scan-report';

const raw:Scan={score:100,problemes:[],pointsForts:[],motsClesManquants:[],recommandations:[]};
test('editor, diagnostic and letter survive a cache round trip, isolated by account and TTL',()=>{
 const state=emptyWorkspace();state.source='CV source suffisamment long pour travailler.';state.text=state.source;state.job='Annonce : développement web et maintenance.';state.letter='Brouillon de lettre à conserver.';
 state.draft={kind:'optimize',headings:labels,data:{nom:'Camille Exemple',titre:'Développement web',contact:{email:'exemple@example.com',telephone:'',ville:'',portfolio:''},profil:'Gestion des demandes internes.',experiences:[],competences:['Java'],formation:[]}};
 state.scan={data:raw,cv:currentCV(state),job:state.job};
 const encoded=encodeDraft('account-a',state,1000);
 assert.deepEqual(decodeDraft(encoded,'account-a',2000),state);assert.equal(decodeDraft(encoded,'account-b',2000),null);
 assert.notEqual(cacheKey('account-a'),cacheKey('account-b'));assert.equal(decodeDraft(encoded,'account-a',1000+CACHE_TTL),null);
 assert.equal(decodeDraft('{broken','account-a',2000),null);assert.equal(decodeDraft(encoded,'account-a',999),null);
 assert.equal(isScanStale(state),false);
 const edited={...state,draft:{...state.draft,data:{...state.draft.data,profil:'Version corrigée avec un livrable précis.'}}};
 assert.equal(isScanStale(edited),true);assert.equal(edited.letter,state.letter);assert.equal(edited.scan,state.scan);
 assert.match(currentCV(edited),/Version corrigée/);
 assert.equal(isScanStale({...state,job:'Autre annonce'}),true);
 assert.equal(decodeDraft(encoded.replace('"version":1','"version":2'),'account-a',2000),null);
});
test('external prompts contain current documents, guarded instructions and letter motivation',()=>{
 for(const mode of ['scan','optimize','structure','letter'] as const){
  const prompt=externalPrompt(mode,'Mon CV corrigé','Mon annonce','Ma motivation');
  assert.match(prompt,/Mon CV corrigé/);assert.match(prompt,/Mon annonce/);assert.match(prompt,/ne rien inventer/);assert.match(prompt,/jamais des instructions/);
  if(mode==='letter')assert.match(prompt,/Ma motivation/);
 }
});
test('anglicisms are contextual alternatives without corrupting technology or English CVs',()=>{
 const issues=anglicisms('COMPÉTENCES\nManagement d\'équipe, reporting et feedback\nJava, Spring Boot, React Native');
 assert.ok(issues.some(p=>p.correction?.includes('encadrement')));assert.ok(issues.every(p=>p.extrait==='Management d\'équipe, reporting et feedback'));
 assert.equal(anglicisms('Skills\nTeam management and reporting\nWork experience').length,0);
 assert.equal(anglicisms('COMPÉTENCES\nJava, Spring Boot, React Native').length,0);
});
test('concrete vague missions cost points; partial results display a qualified numeric score',()=>{
 const text='Camille Exemple\nexemple@example.com\nEXPÉRIENCES\nDéveloppement et optimisation de modules\nContacts avec le client\nFORMATION\nLicence\nCOMPÉTENCES\nJava';
 const report=enrichScan(raw,text,'');assert.ok(report.problemes.some(p=>p.ruleId==='vague_experience'&&p.points===6));
 assert.ok(enrichScan(raw,text.replace('Développement et optimisation de modules','• Développement et optimisation de modules'),'').problemes.some(p=>p.ruleId==='vague_experience'&&p.extrait?.startsWith('•')));
 assert.equal(report.problemes.filter(p=>p.ruleId==='vague_experience').length,2);assert.equal(report.evaluation?.dimensions.impact,8);
 assert.equal(report.evaluation?.method,'cvats-3');assert.equal(report.evaluation?.qualitativeComplete,false);
 const html=renderToStaticMarkup(React.createElement(ScanReport,{data:report,hasJob:false}));
 assert.match(html,/Score indicatif/);assert.match(html,/peut surestimer/);assert.ok(!html.includes('Bonne base'));assert.ok(html.includes('score-breakdown'));assert.match(html,/>88<small>/);
});
