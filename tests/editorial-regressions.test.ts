import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enrichScan} from '../lib/diagnostic';
import {diagnosticCategories} from '../lib/diagnostic-schema';
import type {Scan} from '../lib/cv';
import {emptyWorkspace,encodeDraft,decodeDraft} from '../lib/workspace-draft';
import {composeLetter,externalPrompt,letterSectionsSchema} from '../lib/candidature-prompts';
import {researchError,emptyCompanyResearch,companySearchURL} from '../lib/company-research';

const raw:Scan={score:0,pointsForts:[],problemes:[],motsClesManquants:[],recommandations:[]};
test('short spelling and grammar corrections survive grounding and independent issues on one line survive deduplication',()=>{
 const source='exemple@example.com\nCOMPÉTENCES\nRéalisation de nouvelles fonctionalitées pour les client.';
 const issue={categorie:'orthographe' as const,severite:'moyenne' as const,texte:'Accord',extrait:'Réalisation de nouvelles fonctionalitées pour les client.',correction:'les clients'};
 const result=enrichScan({...raw,problemes:[issue,{...issue,texte:'Coquille',correction:'fonctionnalités'},{...issue,texte:'Doublon'}, {...issue,extrait:'Citation inventée',correction:'correction'}, {...issue,correction:'Corrige les fautes.'}]},source,'');
 const model=result.problemes.filter(p=>p.origine==='ia');
 assert.equal(model.length,2);assert.ok(model.some(p=>p.correction==='fonctionnalités'));assert.ok(model.some(p=>p.correction==='les clients'));
 assert.equal(result.evaluation?.dimensions.clarte,10);assert.equal(result.evaluation?.rejectedSuggestions,2);
});
test('job-fit uncertainty and examined editorial ambiguity do not invalidate the score; missing axes stay incomplete',()=>{
 const controles=(Object.keys(diagnosticCategories) as Array<keyof typeof diagnosticCategories>).map(categorie=>({categorie,statut:categorie==='adequation'?'non_evalue' as const:categorie==='chronologie'?'a_verifier' as const:'ok' as const,constat:'Examiné ; précision nécessaire pour les dates.'}));
 const source='exemple@example.com\nEXPÉRIENCES\nMaintenance du portail interne\nCOMPÉTENCES\nJava\nFORMATION\nLicence';
 assert.equal(enrichScan({...raw,controles},source,'Minimum 5 ans d\'expérience en Java').evaluation?.qualitativeComplete,true);
 assert.equal(enrichScan({...raw,controles:controles.filter(c=>c.categorie!=='orthographe')},source,'').evaluation?.qualitativeComplete,false);
 const withTypo=source+'\nCurieux des techonologies';
 assert.equal(enrichScan({...raw,controles:controles.map(c=>c.categorie==='orthographe'?{...c,statut:'a_corriger'}:c)},withTypo,'').evaluation?.qualitativeComplete,true);
});
test('local spelling and model spelling do not charge the same correction twice',()=>{
 const result=enrichScan({...raw,problemes:[{categorie:'orthographe',severite:'moyenne',texte:'Coquille',extrait:'Curieux des techonologies',correction:'technologies'}]},'exemple@example.com\nCurieux des techonologies\nCENTRES D\'INTÉRÊTS','');
 assert.equal(result.problemes.filter(p=>p.correction?.includes('technologies')).length,1);
 assert.ok(result.problemes.some(p=>p.correction==='CENTRES D\'INTÉRÊT'));
});
test('letter has exactly three body paragraphs; sources survive cache and external prompts, old caches still load',()=>{
 const sections=letterSectionsSchema.parse({je:'Je maintiens les interfaces React du portail de suivi des commandes.\n\nCette expérience me prépare à vos missions.',vous:'Votre annonce décrit un besoin de maintenance des applications que je souhaite approfondir.',nous:'Nous pourrions échanger sur le suivi de vos applications et sur ma contribution à leur maintenance.'});
 assert.equal(composeLetter(sections).split('\n\n').length,4); // salutation + three body paragraphs
 assert.throws(()=>letterSectionsSchema.parse({...sections,vous:''}));
 const state=emptyWorkspace();state.companyResearch={company:'Entreprise Exemple',url:'https://exemple.test/actualites',date:'2026-09-01',excerpt:'L\'entreprise présente un nouveau portail.'};
 assert.deepEqual(decodeDraft(encodeDraft('a',state,1000),'a',2000)?.companyResearch,state.companyResearch);
 const envelope=JSON.parse(encodeDraft('a',state,1000));delete envelope.state.companyResearch;delete envelope.state.letterContext;
 assert.deepEqual(decodeDraft(JSON.stringify(envelope),'a',2000)?.companyResearch,emptyCompanyResearch());
 const prompt=externalPrompt('letter','CV','Annonce','Intérêt pour ce projet',state.companyResearch);
 assert.match(prompt,/JE, VOUS, NOUS/);assert.match(prompt,/nouveau portail/);assert.match(prompt,/2026-09-01/);assert.match(prompt,/liens ne sont pas consultés automatiquement/);
 assert.equal(researchError(state.companyResearch),null);
 assert.ok(researchError({...state.companyResearch,url:'javascript:alert(1)'}));
 assert.ok(researchError({...state.companyResearch,excerpt:''}));
 assert.ok(researchError({...state.companyResearch,date:'2026-02-31'}));
 assert.equal(researchError(emptyCompanyResearch()),null);
 assert.equal(new URL(companySearchURL('Exemple & Co')).searchParams.get('q'),'Exemple & Co actualités communiqué site officiel');
});
