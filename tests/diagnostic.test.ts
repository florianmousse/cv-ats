import {test} from 'node:test';
import assert from 'node:assert/strict';
import {enrichScan,experiencePhrases,localDiagnostics,localRequirements} from '../lib/diagnostic';
import {scanSchema,type Scan} from '../lib/cv';
import {extractJobKeywords,hasKeyword} from '../lib/keywords';
import {scanPrompt} from '../lib/scan-prompt';

// Synthetic, anonymized regression fixture. No real name, address, phone or employer.
export const sampleCV=`Camille Exemple
I N G É N I E U R
I N F O R M A T I Q U E
COMPÉTENCES
Symfony, Twig, Angular, Flutter, React Native
Java, C#, C++, Python
PostgreSQL, MongoDB, Appwrite
Javascript, PHP
Docker, Git / Gitlab / Github
Travailler en équipe
LANGUES
Anglais niveau B2 (930/990 TOEIC - 2023)
CENTRES D’INTÉRÊT
Curieux des nouvelles techonologies
EXPÉRIENCES
DÉVELOPPEUR LOGICIEL
Entreprise Exemple | 50 semaines - 2023/2024
Conception et développement front et back de
nouvelles fonctionnalités
Corrections d’anomalies suite aux phases
d’homologation et de recette (PHPUnit, Behat)
Mise à jour des spécifications techniques et
fonctionnelles
Contacts avec le client
DÉVELOPPEUR LOGICIEL
Autre entreprise | 11 semaines - 2021
Développement et optimisation de modules
Compréhension du besoin utilisateur
Programmation orientée objet, base de données
et réalisation de l’interface
FORMATION
Diplôme informatique - 2024
QUALITÉS
Autonome, organisé`;
export const sampleJob=`Missions : Développement, Intégration, Accompagnement des développeurs.
Minimum 5 ans d’expérience sur les technologies & frameworks :
Front-end : RxJS, JavaScript, TypeScript, ReactJS ou Angular avec un minimum de 2 ans d’expérience en Angular 14 minimum.
Back-end : Spring Boot, Hibernate, Junit, Java avec un minimum de 2 ans d’expérience sur Java 17.
Process CI/CI : Git, Maven, Jenkins, Pipeline multibranches, Nexus (ou équivalent).
Autonomie et rigueur ; adaptation, esprit d’équipe ; analyse et synthèse ; anglais.
Avantages : 27 jours de congés, télétravail, actionnariat.`;
const sparse:Scan={score:80,pointsForts:[],problemes:[{severite:'faible',texte:'L’analyse textuelle ne permet pas de vérifier la mise en page visuelle (couleurs, polices, colonnes).'}],motsClesManquants:[],recommandations:[]};

test('sparse model output still yields concrete spelling, typography and experience findings',()=>{
 const result=enrichScan(sparse,sampleCV,sampleJob);
 assert.ok(result.problemes.some(p=>p.categorie==='orthographe'&&p.extrait==='techonologies'&&p.correction?.includes('technologies')));
 assert.ok(result.problemes.some(p=>p.categorie==='typographie'&&p.extrait==='I N G É N I E U R'));
 assert.ok(result.problemes.some(p=>p.categorie==='formulations'&&p.extrait==='Contacts avec le client'));
 assert.ok(result.problemes.some(p=>p.categorie==='realisations'));
 assert.ok(!result.problemes.some(p=>p.texte.includes('ne permet pas de vérifier')));
 assert.equal(result.controles?.length,10);
 assert.equal(result.controles?.find(c=>c.categorie==='chronologie')?.statut,'non_evalue');
 assert.ok(result.mesures!.mots>100);assert.equal(result.score,80); // no automatic word-count penalty
 assert.ok(scanSchema.safeParse(result).success);
});

test('line wrapping is reconstructed before short or long experience checks',()=>{
 const phrases=experiencePhrases(sampleCV);
 assert.ok(phrases.includes('Conception et développement front et back de\nnouvelles fonctionnalités'));
 assert.ok(!phrases.includes('nouvelles fonctionnalités'));
 assert.ok(!phrases.some(p=>p.includes('Diplôme')));
 assert.equal(localDiagnostics('Développement React.').mesures.phrasesExperience,0);
 assert.equal(localDiagnostics('Conception '+Array(400).fill('interface').join(' ')).issues.some(p=>p.categorie==='densite'),false);
});

test('job extraction includes missing technologies and versions without related-skill false positives',()=>{
 const result=enrichScan(sparse,sampleCV,sampleJob);
 for(const term of ['RxJS','TypeScript','React','Spring Boot','Hibernate','JUnit','Maven','Jenkins','Pipeline multibranches','Nexus','Angular 14','Java 17'])assert.ok(result.motsClesManquants.includes(term),term);
 for(const term of ['Java','JavaScript','Angular','Git','Anglais','Autonomie','Esprit d’équipe'])assert.ok(!result.motsClesManquants.includes(term),term);
 assert.equal(hasKeyword('React Native','ReactJS'),false);assert.equal(hasKeyword('PHPUnit','JUnit'),false);
 assert.equal(hasKeyword('JavaScript','Java'),false);assert.equal(hasKeyword('AngularJS','Angular'),false);
 assert.equal(hasKeyword('React.js','ReactJS'),true);assert.equal(hasKeyword('Git / Gitlab / Github','GitLab'),true);
 assert.ok(!extractJobKeywords(sampleJob).includes('27 jours'));
});

test('duration requirements retain separate technology contexts and never infer years from listed skills',()=>{
 const requirements=localRequirements(sampleCV,sampleJob).filter(r=>r.categorie==='experience');
 assert.equal(requirements.length,3);
 assert.ok(requirements.some(r=>r.extraitAnnonce.includes('5 ans')));
 assert.ok(requirements.some(r=>r.extraitAnnonce.includes('Angular 14')));
 assert.ok(requirements.some(r=>r.extraitAnnonce.includes('Java 17')));
 assert.ok(requirements.every(r=>r.statut==='a_preciser'&&!r.preuveCV));
 assert.ok(enrichScan(sparse,sampleCV,sampleJob).problemes.some(p=>p.categorie==='adequation'));
});

test('model requirements and missing terms must be grounded, including unknown métier terms',()=>{
 const job='Maîtrise de la méthode de consolidation Orion et Java 17.';
 const result=enrichScan({...sparse,motsClesManquants:['méthode de consolidation Orion','Kotlin'],exigences:[
  {terme:'Java 17',categorie:'version',extraitAnnonce:job,preuveCV:'Java',statut:'mentionne',conseil:'Version à vérifier.'},
  {terme:'méthode de consolidation Orion',categorie:'technique',extraitAnnonce:job,preuveCV:'Expérience inventée',statut:'mentionne',conseil:'À documenter.'},
  {terme:'Kotlin',categorie:'technique',extraitAnnonce:'Kotlin obligatoire',preuveCV:'',statut:'non_documente',conseil:'À ajouter.'},
 ]},'Java et SQL',job);
 assert.ok(result.motsClesManquants.includes('méthode de consolidation Orion'));
 assert.ok(!result.motsClesManquants.includes('Kotlin'));
 assert.equal(result.exigences?.find(r=>r.terme==='Java 17')?.statut,'a_preciser');
 assert.equal(result.exigences?.find(r=>r.terme==='méthode de consolidation Orion')?.preuveCV,'');
 assert.ok(!result.exigences?.some(r=>r.terme==='Kotlin'));
 const noJob=enrichScan(sparse,sampleCV,'');assert.deepEqual(noJob.exigences,[]);assert.deepEqual(noJob.motsClesManquants,[]);
 const wrapped=localRequirements('API\nREST et Spring\nBoot','API REST et Spring Boot');
 assert.ok(wrapped.every(r=>r.preuveCV&&r.statut==='mentionne'));
 assert.equal(hasKeyword('Intégration continue','CI/CD'),false);
});

test('editorial axes are requested without inventing defects or requiring arbitrary length',()=>{
 assert.match(scanPrompt,/dix axes/);assert.match(scanPrompt,/Il n'y a pas de nombre imposé de problèmes/);
 assert.match(scanPrompt,/aucun nombre universel de mots/i);assert.match(scanPrompt,/NE LA RÉPÈTE PAS/);
 assert.ok(scanSchema.safeParse(sparse).success); // legacy model response still supported
});
