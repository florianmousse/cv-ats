import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mechanicalChecks} from '../lib/mechanical-checks';
import {createImportProof,verifyImportProof} from '../lib/import-proof';
import {enrichScan} from '../lib/diagnostic';
import {scoreIssues} from '../lib/diagnostic-score';
import {scanSchema,type Scan} from '../lib/cv';
import {diagnosticCategories,mechanicalIds} from '../lib/diagnostic-schema';

const source='Camille Exemple\nexemple@example.com\nCOMPÉTENCES\nJava, Angular\nEXPÉRIENCES\nDéveloppement du module de suivi des demandes internes\n2022 – 2024\nMaintenance des interfaces avec une équipe produit\n2020 – 2021\nFORMATION\nLicence informatique';
const raw:Scan={score:6,pointsForts:[],problemes:[],motsClesManquants:[],recommandations:[]};
test('14 stable controls preserve uncertainty and measured PDF facts',()=>{
 const first=mechanicalChecks(source);
 assert.deepEqual(first,mechanicalChecks(source));
 assert.deepEqual(first.checks.map(c=>c.id),[...mechanicalIds]);
 assert.equal(first.checks.find(c=>c.id==='text_layer')?.status,'inconnu');
 assert.equal(first.checks.find(c=>c.id==='page_count')?.status,'inconnu');
 assert.equal(first.checks.find(c=>c.id==='chronology')?.status,'ok');
 assert.equal(first.checks.find(c=>c.id==='phone')?.status,'attention');
 const pdf=mechanicalChecks(source,{format:'pdf',pages:3,charactersPerPage:[110,0,60]});
 assert.equal(pdf.checks.find(c=>c.id==='text_layer')?.status,'attention');
 assert.match(pdf.checks[0].detail,/2\/3/);
 assert.equal(pdf.checks.find(c=>c.id==='page_count')?.status,'attention');
 assert.equal(mechanicalChecks(source,{format:'docx'}).checks.find(c=>c.id==='page_count')?.status,'inconnu');
});
test('date rules handle reverse ranges without inferring duration or rejecting overlap',()=>{
 const reverse=mechanicalChecks(source.replace('2022 – 2024','2024 – 2022'));
 assert.ok(reverse.issues.some(p=>p.ruleId==='date_ranges'));
 assert.equal(mechanicalChecks(source.replace('2020 – 2021','2020 – 2023')).checks.find(c=>c.id==='date_ranges')?.status,'ok');
 assert.equal(mechanicalChecks(source.replace('2022 – 2024','2022/2024').replace('2020 – 2021','2020/2021')).checks.find(c=>c.id==='chronology')?.status,'inconnu');
 assert.equal(mechanicalChecks(source.replace('FORMATION','FORMATION ET DIPLÔMES')+'\n2019 – 2025').checks.find(c=>c.id==='chronology')?.status,'ok');
});
test('import attestation is bound to owner, exact text, metadata and expiry',()=>{
 const facts={format:'pdf' as const,pages:2,charactersPerPage:[80,0]},secret='test-secret-only';
 const proof=createImportProof('user-1',source,facts,secret,1000);
 assert.deepEqual(verifyImportProof(proof,'user-1',source,secret,2000),facts);
 assert.equal(verifyImportProof(proof,'user-2',source,secret,2000),undefined);
 assert.equal(verifyImportProof(proof,'user-1',source+'x',secret,2000),undefined);
 assert.equal(verifyImportProof(proof,'user-1',source,secret,3601000),undefined);
 const [payload,mac]=proof.split('.');
 const data=JSON.parse(Buffer.from(payload,'base64url').toString());data.facts.pages=1;
 assert.equal(verifyImportProof(Buffer.from(JSON.stringify(data)).toString('base64url')+'.'+mac,'user-1',source,secret,2000),undefined);
 assert.equal(verifyImportProof('garbage','user-1',source,secret,2000),undefined);
 assert.throws(()=>createImportProof('user-1',source,{...facts,pages:3},secret,1000));
 assert.ok(!Buffer.from(payload,'base64url').toString().includes(source));
});
test('unquoted, vague and duplicate IA findings do not create duplicate charges',()=>{
 const issue={categorie:'formulations' as const,severite:'moyenne' as const,texte:'Préciser la mission',extrait:'Développement du module de suivi des demandes internes',correction:'Préciser le type de demandes traitées et ton rôle réel dans la conception du module.'};
 const result=enrichScan({...raw,problemes:[issue,{...issue,texte:'Même observation',points:20,dimension:'ats',ruleId:'email'},{...issue,extrait:'Citation inventée'}, {...issue,extrait:undefined},{...issue,correction:'Soyez plus précis.'}]},source,'');
 assert.equal(result.problemes.filter(p=>p.origine==='ia').length,1);
 assert.equal(result.evaluation?.rejectedSuggestions,3);
 assert.equal(result.problemes.find(p=>p.origine==='ia')?.points,2);
 assert.equal(result.score,98);
 assert.ok(scanSchema.safeParse(result).success);
});
test('dimension caps, visible penalties and total score agree',()=>{
 const issues=Array.from({length:35},(_,i)=>({categorie:'orthographe' as const,severite:'élevée' as const,origine:'ia' as const,texte:`Correction ${i}`,extrait:`mot${i}`,correction:'Corriger ce mot.'}));
 const scored=scoreIssues(issues);
 assert.equal(scored.dimensions.clarte,0);assert.equal(scored.score,80);
 assert.equal(scored.problemes.reduce((sum,p)=>sum+p.points,0),100-scored.score);
 assert.equal(Object.values(scored.dimensions).reduce((a,b)=>a+b,0),scored.score);
});
test('short CV, page count and job mismatch never create automatic penalties',()=>{
 const result=enrichScan(raw,source,'Minimum 5 ans d’expérience en Java 17',{format:'pdf',pages:3,charactersPerPage:[80,70,50]});
 assert.equal(result.score,100);
 assert.equal(result.evaluation?.qualitativeComplete,false);
 assert.ok(result.problemes.every(p=>p.points===0));
 const controles=(Object.keys(diagnosticCategories) as Array<keyof typeof diagnosticCategories>).map(categorie=>({categorie,statut:'ok' as const,constat:'Examiné.'}));
 assert.equal(enrichScan({...raw,controles},source,'').evaluation?.qualitativeComplete,true);
});
