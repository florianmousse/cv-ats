import {test} from 'node:test';
import assert from 'node:assert/strict';
import {extractText} from 'unpdf';
import {type CV,groundScan,labels,scanSchema,toPlainText} from '../lib/cv';
import {optimizedSchema} from '../lib/data/saves';
import {defaultPresentation} from '../lib/presentation';
import {jobKeywords,moveItem,redo,remember,undo,updateCV} from '../lib/resume-editor';
import {createCVBlob,createDefinition} from '../lib/pdf';

const cv:CV={nom:'Camille Exemple',titre:'Développeuse web',contact:{ville:'Lyon',telephone:'',email:'camille@example.test',portfolio:''},profil:'Développement d\'applications web.',experiences:[{poste:'Développeuse',entreprise:'Studio Exemple',dates:'2022 – 2025',puces:['Créer des interfaces React.']}],competences:['React','TypeScript'],formation:[]};

test('editing, reordering, undo and redo preserve immutable drafts and branch history',()=>{
 const edited=updateCV(cv,{profil:'Conception et maintenance d\'interfaces web.'});
 assert.equal(cv.profil,'Développement d\'applications web.');
 let state=remember({past:[],present:cv,future:[]},edited);state=remember(state,{...edited,titre:'Développement front-end'});
 assert.equal(undo(state).present.titre,cv.titre);assert.deepEqual(redo(undo(state)),state);
 assert.equal(remember(undo(state),{...edited,nom:'Autre nom'}).future.length,0);
 assert.deepEqual(moveItem(['A','B','C'],0,1),['B','A','C']);assert.deepEqual(moveItem(['A','B'],0,-1),['A','B']);
 assert.throws(()=>updateCV(cv,{competences:Array(101).fill('React')}));
 assert.ok(toPlainText(edited).includes('Conception et maintenance'));assert.ok(!toPlainText(edited).includes(cv.profil));
});

test('saved edited resumes keep presentation while older snapshots remain readable',()=>{
 const legacy={kind:'optimize',data:cv,headings:labels};assert.ok(optimizedSchema.safeParse(legacy).success);
 const edited={...legacy,data:updateCV(cv,{titre:'Front-end'}),presentation:{...defaultPresentation,template:'minimal',density:'compact'}};
 const loaded=optimizedSchema.parse(JSON.parse(JSON.stringify(edited)));
 assert.equal(loaded.data.titre,'Front-end');assert.equal(loaded.presentation?.template,'minimal');
 assert.equal(optimizedSchema.safeParse({...edited,presentation:{...edited.presentation,accent:'javascript:alert(1)'}}).success,false);
});

test('job checks use terms actually in the posting, without skill inference',()=>{
 assert.ok(jobKeywords('Nous cherchons React et TypeScript.').includes('React'));
 assert.ok(!jobKeywords('Nous cherchons React et TypeScript.').includes('JavaScript'));
 assert.deepEqual(jobKeywords('Un poste dans un autre domaine.'),[]);
});

test('diagnostic criteria are bounded, summed and quotes grounded in the source',()=>{
 const result=groundScan(scanSchema.parse({score:99,criteres:{identite:10,sections:15,structure:12,precision:8,pertinence:11},pointsForts:[],problemes:[{severite:'moyenne',texte:'Préciser',extrait:'interfaces React.',correction:'Précise ta contribution.'},{severite:'faible',texte:'Inventé',extrait:'Diriger 10 équipes.'}],motsClesManquants:[],recommandations:[]}),toPlainText(cv));
 assert.equal(result.score,56);assert.equal(result.problemes[0].extrait,'interfaces React.');assert.equal(result.problemes[1].extrait,undefined);
 assert.equal(scanSchema.safeParse({...result,criteres:{...result.criteres,identite:21}}).success,false);
});

test('PDF preview and download renderer use edited content and presentation',async()=>{
 const edited=updateCV(cv,{profil:'Présentation révisée pour cette candidature.',competences:['TypeScript','React']});
 const design={...defaultPresentation,density:'compact' as const,accent:'#614b75' as const};
 const definition=createDefinition(edited,design.template,labels,design);
 assert.equal(definition.defaultStyle?.fontSize,9);assert.equal(definition.styles?.section.color,'#614b75');
 const blob=await createCVBlob(edited,design.template,labels,design);
 assert.ok(blob.size>1000);
 const result=await extractText(new Uint8Array(await blob.arrayBuffer()),{mergePages:true});
 assert.ok(result.text.includes('Présentation révisée'));assert.ok(result.text.includes('Camille Exemple'));assert.ok(!result.text.includes(cv.profil));
});
