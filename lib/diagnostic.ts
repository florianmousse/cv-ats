import {countWords,experiencePhrases} from './text-metrics';
export {countWords,experiencePhrases} from './text-metrics';
import {groundScan,type Scan} from './cv';
import {diagnosticCategories,type DiagnosticCategory,type Requirement} from './diagnostic-schema';
import {canonicalKeyword,extractJobKeywords,hasKeyword,normalizeKeyword,uniqueKeywords} from './keywords';
import {mechanicalChecks} from './mechanical-checks';
import {scoreIssues} from './diagnostic-score';
import type {DocumentFacts} from './document-facts';

type Issue=Scan['problemes'][number];
const normalized=(value:string)=>value.replace(/\s+/g,' ').trim();
const quoted=(source:string,excerpt:string)=>Boolean(excerpt.trim())&&normalized(source).includes(normalized(excerpt));
export function localDiagnostics(source:string){
 const issues:Issue[]=[];
 const add=(categorie:DiagnosticCategory,texte:string,extrait:string,correction:string,severite:Issue['severite']='moyenne')=>issues.push({categorie,texte,extrait,correction,severite,origine:'local'});
 // A small, explicit typo list supplements the model; it is not a general spellchecker.
 const typos:Record<string,string>={techonologies:'technologies',technolgies:'technologies',dévelopement:'développement',développeurss:'développeurs',expériance:'expérience',experiance:'expérience',responsablité:'responsabilité',fonctionnalitées:'fonctionnalités',autononome:'autonome'};
 for(const word of source.match(/\p{L}+/gu)??[]){const replacement=typos[word.toLocaleLowerCase('fr')];if(replacement&&!issues.some(p=>p.extrait===word))add('orthographe',`Orthographe : « ${word} »`,word,`Remplacer par « ${replacement} ». Vérifie aussi les accords dans la phrase.`);}
 const spaced=source.match(/(?:\p{Lu}[ \t]+){4,}\p{Lu}/u);
 if(spaced)add('typographie','Le titre contient des lettres séparées par des espaces',spaced[0],`Dans le texte du CV, écrire « ${spaced[0].replace(/[ \t]/g,'')} » en un seul mot. Vérifie si ces espaces viennent du document ou de son extraction ; ils peuvent gêner le repérage textuel.`);
 for(const [pattern,replacement] of [[/\bJavascript\b/g,'JavaScript'],[/\bGitlab\b/g,'GitLab'],[/\bGithub\b/g,'GitHub']] as const){const match=source.match(pattern);if(match)add('typographie',`Harmoniser l’écriture de ${replacement}`,match[0],`Utiliser la graphie « ${replacement} » de manière cohérente.`, 'faible');}
 const words=countWords(source),phrases=experiencePhrases(source);
 if(words<300)add('densite',`Volume de texte à examiner : ${words} mots`,'','Ce volume court est un repère éditorial, pas une norme ATS ni une pénalité automatique. Si des informations utiles manquent, précise les missions, outils réellement utilisés et livrables. Ne rallonge pas le CV pour atteindre un quota de mots.','faible');
 const short=phrases.filter(p=>countWords(p)<6),long=phrases.filter(p=>countWords(p)>38);
 for(const phrase of short.slice(0,3))add('formulations',`Mission à préciser : « ${normalized(phrase).slice(0,80)} »`,phrase,'Précise l’action, son objet et ta contribution. Par exemple : « Échanger avec [interlocuteurs réels] pour [objectif réel] ». Remplace les crochets uniquement par des faits vérifiables.');
 for(const phrase of long.slice(0,2))add('formulations','Une phrase d’expérience est longue à parcourir',phrase,'Sépare les actions distinctes en deux puces. Repère indicatif : plus de 38 mots dans cette phrase reconstituée ; adapte la longueur à son contenu.','faible');
 const generic=phrases.find(p=>/\b(?:développement et optimisation de modules|conception et développement|participation au|mise à jour des spécifications)\b/i.test(normalized(p)));
 if(generic)add('realisations','Une réalisation peut être rendue plus concrète',generic,'Indique quel module ou livrable, pour quel besoin et avec quels outils réellement utilisés dans cette mission. Si tu connais un résultat vérifiable, précise-le ; un livrable ou un résultat qualitatif suffit, aucun chiffre n’est obligatoire.');
 return {issues,mesures:{mots:words,phrasesExperience:phrases.length,phrasesCourtes:short.length,phrasesLongues:long.length}};
}

function lineWith(source:string,term:string){
 const excerpt=source.split(/\r?\n/).find(line=>hasKeyword(line,term))??source;
 // Overlapping windows retain exact quotes even with very long paragraphs or wrapped terms.
 for(let start=0;start<excerpt.length;start+=1200){const part=excerpt.slice(start,start+1800);if(hasKeyword(part,term))return part.trim();}
 return '';
}
function categoryFor(term:string):Requirement['categorie']{
 if(/\d/.test(term)&&/^(Angular|Java|Python|React|Spring|PHP|Node|\.NET)\b/i.test(term))return 'version';
 if(['Anglais','Allemand','Espagnol','Français','TOEIC','B2','C1'].includes(term))return 'langue';
 if(['Autonomie','Rigueur','Adaptation','Esprit d’équipe','Analyse','Synthèse','Communication'].includes(term))return 'qualite';
 if(['Finance','ERP','Cloud','Testing','Support','Maintenance applicative'].includes(term))return 'contexte';
 if(['Développement','Intégration','Accompagnement des développeurs','Conception','Spécifications techniques','Documentation','Gestion de projet'].includes(term))return 'mission';
 return 'technique';
}
export function localRequirements(source:string,job:string):Requirement[]{
 const result:Requirement[]=extractJobKeywords(job).map<Requirement>(terme=>{
  const categorie=categoryFor(terme),preuveCV=lineWith(source,terme),extraitAnnonce=lineWith(job,terme);
  const qualified=categorie==='version'||categorie==='qualite';
  return {terme,categorie,extraitAnnonce,preuveCV,statut:preuveCV?(qualified?'a_preciser':'mentionne'):'non_documente',origine:'local',conseil:preuveCV?'Mention repérée ; vérifie le contexte, le niveau et les éventuelles alternatives dans l’annonce.':'Non repéré dans ce CV. Cela ne prouve pas une absence de compétence. À documenter uniquement si ton parcours le justifie.'};
 }).filter(item=>quoted(job,item.extraitAnnonce));
 for(const match of job.matchAll(/\b(?:minimum\s+(?:de\s+)?)?\d+(?:[.,]\d+)?\s+(?:ans?|années?|mois)\s+d[’']expérience\b/gi)){
  const start=Math.max(job.lastIndexOf('\n',match.index)+1,match.index-100),end=job.indexOf('\n',match.index);
  const extraitAnnonce=job.slice(start,end<0?Math.min(job.length,match.index+350):Math.min(end,match.index+350)).trim();
  result.push({terme:match[0],categorie:'experience',extraitAnnonce,preuveCV:'',statut:'a_preciser',origine:'local',conseil:'Vérifie la durée totale et la durée propre à chaque technologie demandée. Des dates, une durée de stage ou une compétence listée ne suffisent pas à prouver cette exigence. Ne cumule pas les périodes qui se chevauchent.'});
 }
 return result;
}

/** Combine grounded model findings with reproducible text checks, without another AI call. */
export function enrichScan(raw:Scan,source:string,job:string,facts?:DocumentFacts):Scan{
 const scan=groundScan(raw,source),local=localDiagnostics(source),mechanical=mechanicalChecks(source,facts);
 // The visual-analysis limitation belongs in the report introduction, not the correction list.
 const limitation=(value:string)=>/ne permet pas|impossible|ne peux pas|ne peut pas|pas possible|non évalu|non vérifi/i.test(value)&&/mise en page|couleurs|polices|colonnes|visuel/i.test(value);
 const modelIssues=scan.problemes.filter(p=>!limitation(p.texte)&&p.extrait&&p.categorie&&p.correction&&p.correction.trim().length>=20&&!/^(?:améliore[rz]? (?:le|votre|ton) cv|soyez plus précis|être plus précis|ajoute[rz]? des détails|corrige[rz]? les fautes)[.!\s]*$/i.test(p.correction.trim())).map(p=>({categorie:p.categorie,severite:p.severite,texte:p.texte,extrait:p.extrait,correction:p.correction,origine:'ia' as const}));
 const issues:Issue[]=[];
 for(const issue of [...local.issues,...mechanical.issues,...modelIssues]){
  const duplicate=issues.findIndex(p=>(p.categorie===issue.categorie&&p.extrait&&issue.extrait&&(normalized(p.extrait).includes(normalized(issue.extrait))||normalized(issue.extrait).includes(normalized(p.extrait))))||normalized(p.texte)===normalized(issue.texte));
  if(duplicate<0)issues.push(issue);
 }
 const requirements=localRequirements(source,job);
 for(const item of scan.exigences??[]){
  if(!quoted(job,item.extraitAnnonce)||!hasKeyword(item.extraitAnnonce,item.terme))continue;
  const proof=quoted(source,item.preuveCV)?item.preuveCV:'';
  let statut=item.statut;
  if(!proof&&statut==='mentionne')statut='non_documente';
  if((item.categorie==='technique'||item.categorie==='version')&&statut==='mentionne'&&!hasKeyword(proof,item.terme))statut='a_preciser';
  if(item.categorie==='experience'&&statut==='mentionne')statut='a_preciser';
  const next={...item,preuveCV:proof,statut,origine:'ia' as const};
  const index=requirements.findIndex(r=>normalizeKeyword(canonicalKeyword(r.terme))===normalizeKeyword(canonicalKeyword(item.terme))&&r.categorie===item.categorie);
  // A model cannot turn an unqualified mention into evidence of a required duration/version.
  if(index>=0)requirements[index]=next;else requirements.push(next);
 }
 const durations=requirements.filter(r=>r.categorie==='experience');
 if(durations.length&&!issues.some(p=>p.categorie==='adequation'))issues.push({categorie:'adequation',severite:'moyenne',origine:'local',texte:'Vérifier les durées d’expérience demandées',extrait:'',correction:`L’annonce mentionne ${uniqueKeywords(durations.map(r=>r.terme)).join(' ; ')}. Le relevé ci-dessous conserve le contexte de chaque exigence. Relie tes périodes aux technologies concernées ; une compétence listée seule ne démontre pas ces durées. Il s’agit d’une vérification d’adéquation, pas d’un mot-clé à ajouter artificiellement.`});
 const terms=uniqueKeywords([...extractJobKeywords(job),...scan.motsClesManquants.filter(t=>t.length<=200&&hasKeyword(job,t)),...requirements.filter(r=>r.categorie!=='experience').map(r=>r.terme)]);
 const missing=terms.filter(t=>!hasKeyword(source,t)&&!requirements.some(r=>normalizeKeyword(canonicalKeyword(r.terme))===normalizeKeyword(canonicalKeyword(t))&&r.statut==='mentionne'&&r.preuveCV));
 const controles=(Object.keys(diagnosticCategories) as DiagnosticCategory[]).map(categorie=>{
  const model=scan.controles?.find(c=>c.categorie===categorie);
  const hits=issues.filter(p=>p.categorie===categorie);
  if(hits.length)return {categorie,statut:'a_corriger' as const,constat:`${hits.length} point${hits.length>1?'s':''} à examiner dans les corrections ci-dessous.`};
  if(model?.statut==='a_corriger')return {categorie,statut:'non_evalue' as const,constat:'Le modèle a signalé un problème sans fournir de correction suffisamment étayée. Aucune pénalité retenue pour ce constat.'};
  return model??{categorie,statut:'non_evalue' as const,constat:'Le modèle n’a pas fourni de conclusion pour ce contrôle. Cela ne signifie pas qu’aucun problème n’existe.'};
 });
 const scored=scoreIssues(issues);
 const qualitativeComplete=Object.keys(diagnosticCategories).filter(c=>job||c!=='adequation').every(c=>scan.controles?.some(check=>check.categorie===c&&check.statut!=='non_evalue'&&check.statut!=='a_verifier'&&(check.statut!=='a_corriger'||modelIssues.some(p=>p.categorie===c))));
 return {...scan,score:scored.score,criteres:undefined,problemes:scored.problemes,controles,mecanique:mechanical.checks,evaluation:{method:'cvats-2',dimensions:scored.dimensions,qualitativeComplete,rejectedSuggestions:scan.problemes.length-modelIssues.length},exigences:requirements.slice(0,100),mesures:local.mesures,motsClesManquants:missing.slice(0,100),recommandations:scored.problemes.filter(p=>p.correction).slice(0,3).map(p=>p.correction!)};
}
