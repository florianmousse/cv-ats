import {test} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {extractText} from 'unpdf';
import {unzipSync,strFromU8} from 'fflate';
import {cvSchema,labels,toPlainText,assertGroundedFields,type CV} from '../lib/cv';
import {buildDocx} from '../lib/docx';
import {createCVBlob} from '../lib/pdf';
import ResumePreview from '../components/resume-preview';
import {defaultPresentation} from '../lib/presentation';
import {optimizedSchema} from '../lib/data/saves';
import {emptyWorkspace,encodeDraft,decodeDraft,currentCV} from '../lib/workspace-draft';
import {languageChecks,languageDiagnostics} from '../lib/language-checks';
import {extractJobKeywords,hasKeyword} from '../lib/keywords';
import {enrichScan,localRequirements} from '../lib/diagnostic';

const cv:CV={nom:'Camille Exemple',titre:'Développement web',contact:{ville:'Rennes',email:'exemple@example.test',telephone:'',portfolio:''},profil:'Conception de logiciels.',experiences:[],competences:['React'],formation:[{intitule:'DUT informatique',etablissement:'IUT Exemple',dates:'2021',details:'Troisième de promotion'}],
 langues:[{langue:'Allemand',niveau:'Bilingue',certification:'',score:'',date:''},{langue:'Anglais',niveau:'B2',certification:'TOEIC',score:'930/990',date:'2023'}],
 certifications:[{intitule:'Certification Exemple',organisme:'Organisme Exemple',date:'2024',details:'Module de développement'}],
 projets:[{nom:'Portail associatif',description:'Développement du suivi des adhésions.',lien:'https://exemple.test/portail'}],
 interets:['Hockey en club pendant 10 ans','Entraînement bénévole'],autresSections:[{titre:'Qualités',contenu:'Curieux, autonome'}]};

test('all editable sections survive schema, preview, ATS text, cache, Word and PDF',async()=>{
 assert.deepEqual(cvSchema.parse(cv),cv);
 const result=optimizedSchema.parse({kind:'optimize',data:cv,headings:labels});
 const state={...emptyWorkspace(),draft:result};
 const restored=decodeDraft(encodeDraft('a',state,1000),'a',2000)!;
 assert.deepEqual(restored.draft,result);assert.match(currentCV(restored),/Hockey en club/);
 const text=toPlainText(cv),html=renderToStaticMarkup(React.createElement(ResumePreview,{cv,headings:labels,design:defaultPresentation}));
 const word=await buildDocx(cv);const xml=strFromU8(unzipSync(new Uint8Array(await word.arrayBuffer()))['word/document.xml']);
 const pdf=await createCVBlob(cv,'modern',labels);const extracted=await extractText(new Uint8Array(await pdf.arrayBuffer()),{mergePages:true});
 for(const content of [text,html,xml,extracted.text])for(const value of ['Allemand','Bilingue','930/990','2023','Certification Exemple','Portail associatif','Hockey en club','Curieux, autonome','Troisième de promotion'])assert.ok(content.includes(value),value);
 assertGroundedFields(cv,text);
 assert.throws(()=>assertGroundedFields({...cv,langues:[{...cv.langues![0],niveau:'C2'}]},text),/écarté/);
});

test('legacy saved CVs keep loading with empty optional sections and default new headings',()=>{
 const {langues,certifications,projets,interets,autresSections,...legacy}=cv;
 assert.ok(langues&&certifications&&projets&&interets&&autresSections);
 const saved=optimizedSchema.parse({kind:'optimize',data:legacy,headings:{profil:'Profil',experiences:'Expérience',competences:'Compétences',formation:'Formation'}});
 assert.equal(saved.headings.interets,'Centres d\'intérêt');assert.equal(saved.data.interets,undefined);
 assert.ok(!toPlainText(saved.data).includes('CENTRES D\'INTÉRÊT'));
 assert.throws(()=>cvSchema.parse({...cv,interets:Array(31).fill('Activité')}));
});

test('bilingual is not converted to C2; the sample TOEIC gives a cautious B2 reference and historical date',()=>{
 const checks=languageChecks('Bilingue Allemand\nAnglais niveau B2 (930/990 TOEIC - 2023)',2026);
 assert.ok(checks.some(c=>c.code==='bilingual'&&c.detail.includes('pas automatiquement à C2')));
 assert.ok(checks.some(c=>c.code==='test_name'));
 assert.ok(checks.some(c=>c.code==='total_level'&&c.detail.includes('B2')&&c.status==='info'));
 assert.ok(checks.some(c=>c.code==='old_score'));assert.ok(!checks.some(c=>c.code==='cefr_claim'));
 const report=enrichScan({score:0,pointsForts:[],problemes:[],recommandations:[],motsClesManquants:[]},toPlainText(cv),'');
 assert.ok(report.verificationsLangues?.some(c=>c.code==='total_level'));
 assert.ok(report.problemes.some(p=>p.ruleId==='language_test_name'));
 assert.ok(report.problemes.some(p=>p.ruleId==='language_old_score')); // independent findings on the same line
 assert.ok(report.problemes.filter(p=>p.ruleId?.startsWith('language_')).every(p=>p.points===0));
});

test('TOEIC bounds, increments, totals and per-section levels are checked without authenticating',()=>{
 assert.ok(languageChecks('TOEIC Listening & Reading 1000/990 - 2026',2026).some(c=>c.code==='score_range'));
 assert.ok(languageChecks('TOEIC L&R 932/990 - 2026',2026).some(c=>c.code==='score_range'));
 assert.ok(!languageChecks('TOEIC L&R 930/990 - 2026',2026).some(c=>c.code==='score_range'));
 const mismatch=languageChecks('TOEIC Listening & Reading C1 945/990 ; Listening 495/495 ; Reading 450/495 - 2026',2026);
 assert.ok(mismatch.some(c=>c.code==='cefr_claim'));assert.ok(mismatch.some(c=>c.code==='section_levels'&&c.detail.includes('Reading 450/495 : repère B2')));
 assert.ok(languageChecks('TOEIC L&R 930/990 ; Listening 490/495 ; Reading 450/495 - 2026',2026).some(c=>c.code==='sum'));
 const valid=languageChecks('TOEIC L&R C1 945/990 ; Listening 490/495 ; Reading 455/495 - 2026',2026);
 assert.ok(!valid.some(c=>c.status==='attention'));
 assert.ok(languageChecks('TOEIC L&R C2 990/990 - 2026',2026).some(c=>c.code==='cefr_claim'));
});

test('unknown variants, dates and other certifications are never silently converted',()=>{
 for(const source of ['TOEIC Speaking 180/200 - 2026','TOEIC Bridge 90/100 - 2026','TOEIC 4 skills 930/990 - 2026'])assert.ok(!languageChecks(source,2026).some(c=>c.code==='total_level'||c.code==='score_range'));
 assert.ok(languageChecks('TOEIC 930/990',2026).some(c=>c.code==='missing_date'));
 assert.ok(languageChecks('TOEIC 930/990 - 2024',2026).some(c=>c.code==='date_precision'));
 assert.ok(!languageChecks('TOEIC 930/990 - 2024',2026).some(c=>c.code==='old_score'));
 assert.ok(languageChecks('TOEIC prévu en 2027',2026).some(c=>c.code==='future_date'));
 assert.equal(languageChecks('Goethe-Zertifikat C2 - 2026\nCambridge English 190',2026).length,0);
 assert.ok(languageDiagnostics('Bilingue Allemand',2026).every(p=>p.origine==='local'));
});

test('language keyword matching recognises bilingual and CEFR mentions without equating them',()=>{
 const terms=extractJobKeywords('Allemand bilingue ou niveau C2. Anglais B1.');
 assert.ok(terms.includes('Bilingue'));assert.ok(terms.includes('C2'));assert.ok(terms.includes('B1'));
 assert.equal(hasKeyword('Allemand bilingue','C2'),false);
 const requirement=localRequirements('Allemand C2 autoévalué','Allemand C2').find(r=>r.terme==='C2');
 assert.equal(requirement?.categorie,'langue');assert.equal(requirement?.statut,'a_preciser');
});

test('long extracted lines stay bounded and incorrect L&R denominators are flagged',()=>{
 const source='x'.repeat(15000)+' TOEIC Listening & Reading 930/1000 - 2023 '+'x'.repeat(15000);
 const checks=languageChecks(source,2026);
 assert.ok(checks.some(c=>c.code==='denominator'));
 assert.ok(checks.every(c=>c.excerpt.length<=1200&&source.includes(c.excerpt)));
 for(const date of ['10/05/2026','05/2026'])assert.ok(!languageChecks(`TOEIC Listening & Reading 930/990 - ${date}`,2026).some(c=>c.code==='denominator'));
});
