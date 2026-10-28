import type {Scan} from './cv';
import type {DocumentFacts} from './document-facts';
import type {MechanicalCheck} from './diagnostic-schema';
import {countWords,experiencePhrases} from './text-metrics';

/** Conservative text heuristics. Unknown is never silently converted to a pass. */
export function mechanicalChecks(source:string,facts?:DocumentFacts){
 const checks:MechanicalCheck[]=[];
 const issues:Scan['problemes']=[];
 const add=(id:MechanicalCheck['id'],label:string,status:MechanicalCheck['status'],detail:string,extrait?:string)=>checks.push({id,label,status,detail,...(extrait?{extrait}:{})});
 const issue=(ruleId:string,categorie:Scan['problemes'][number]['categorie'],texte:string,correction:string,extrait='')=>issues.push({ruleId,categorie,texte,correction,extrait,severite:'moyenne',origine:'local'});
 const lines=source.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
 const normalized=lines.map(s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[:：]/g,'').trim());
 const section=(pattern:RegExp)=>normalized.findIndex(s=>pattern.test(s));
 const experience=section(/^(?:experiences?(?: professionnelles?)?|parcours professionnel|employment|work experience|professional experience|projets?(?: personnels?|professionnels?|academiques?)?|projects?)$/);
 const education=section(/^(?:formations?(?: et diplomes)?|education|etudes|diplomes?)$/);
 const skills=section(/^(?:competences?(?: techniques?| informatiques?)?|skills|technical skills|savoir-faire)$/);
 const empty=facts?.format==='pdf'?facts.charactersPerPage.filter(n=>n===0).length:0;
 add('text_layer','Texte extrait du fichier',facts?(empty?'attention':'ok'):'inconnu',facts?.format==='pdf'?`${facts.pages-empty}/${facts.pages} pages contiennent du texte extractible. ${empty?'Une page sans texte peut être vide ou constituée d\'images ; vérifie le document.':'Cela ne valide ni l\'ordre de lecture ni le contenu des images.'}`:facts?.format==='docx'?'Du texte a été extrait du DOCX ; les images et zones flottantes ne sont pas vérifiées.':'Texte collé, modifié, rechargé ou preuve d\'import expirée : le fichier d\'origine n\'est pas vérifiable.');
 if(empty)issue('text_layer','structure','Des pages du PDF ne contiennent aucun texte extractible','Ouvre les pages concernées : si elles contiennent des informations utiles sous forme d\'image, utilise un export avec texte ou retranscris-les. Une page volontairement vide ne nécessite pas de correction.');
 add('page_count','Nombre de pages',facts?.format==='pdf'?(facts.pages>2?'attention':'ok'):'inconnu',facts?.format==='pdf'?`${facts.pages} page${facts.pages>1?'s':''} mesurée${facts.pages>1?'s':''}. ${facts.pages>2?'Vérifie que chaque page apporte des informations utiles.':'Ce nombre seul ne garantit pas la pertinence du contenu.'} Aucune pénalité liée au nombre de pages.`:'Le nombre de pages ne se déduit pas du texte ; il dépend aussi du rendu pour un DOCX.');
 const email=/\b[^\s@]+@[^\s@]+\.[a-z]{2,}\b/i.test(source);
 add('email','Adresse e-mail',email?'ok':'attention',email?'Une adresse au format e-mail est repérée ; sa validité réelle n\'est pas testée.':'Aucune adresse e-mail au format habituel repérée. Vérifie que le recruteur dispose d\'un moyen de réponse.');
 if(!email)issue('email','structure','Adresse e-mail non repérée','Ajoute une adresse professionnelle valide si tu souhaites être contacté par e-mail. Vérifie d\'abord que l\'extraction ne l\'a pas coupée.');
 const phone=/(?:\+\d{1,3}[ .()-]*)?(?:\d[ .()-]*){10,13}/.test(source);
 add('phone','Téléphone',phone?'ok':'attention',phone?'Un numéro plausible est repéré ; son fonctionnement n\'est pas vérifié.':'Aucun numéro au format habituel repéré. Le téléphone est facultatif si un autre moyen de contact convient ; aucune pénalité.');
 for(const [id,label,index,category] of [['experience_section','Expériences ou projets',experience,'structure'],['education_section','Formation',education,'structure'],['skills_section','Compétences',skills,'competences']] as const){
  add(id,label,index>=0?'ok':'attention',index>=0?`Titre reconnu : « ${lines[index]} ». Le contenu reste à relire.`:'Aucun titre standard reconnu par les règles locales. Une rubrique équivalente peut exister sous un autre intitulé.');
  if(index<0)issue(id,category,`Rubrique à identifier : ${label}`,`Si cette rubrique existe, utilise un titre explicite comme « ${label} ». Sinon, ajoute uniquement les éléments de ton parcours utiles à la candidature.`);
 }
 const end=experience<0?-1:normalized.findIndex((s,i)=>i>experience&&(i===education||i===skills||/^(?:langues?|interets|qualites|projets?(?: personnels?|professionnels?|academiques?)?)$/.test(s)));
 const experienceLines=experience<0?[]:lines.slice(experience+1,end<0?undefined:end);
 // Only complete numeric year ranges, never isolated dates or ambiguous slash dates.
 const ranges=experienceLines.flatMap(line=>[...line.matchAll(/\b((?:19|20)\d{2})\s*[-–—]\s*((?:19|20)\d{2})\b/g)].map(m=>({start:Number(m[1]),end:Number(m[2]),quote:line})));
 const reversed=ranges.find(r=>r.end<r.start);
 const outOfOrder=ranges.some((r,i)=>i>0&&r.end>ranges[i-1].end);
 add('chronology','Ordre des expériences',ranges.length<2?'inconnu':outOfOrder?'attention':'ok',ranges.length<2?'Moins de deux périodes numériques complètes repérées : ordre non conclu.':outOfOrder?'Les fins de périodes ne sont pas toutes présentées de la plus récente à la plus ancienne. Un regroupement par métier peut être intentionnel.':'Les fins de périodes numériques repérées suivent un ordre décroissant. Les autres formats de dates restent à relire.');
 add('date_ranges','Cohérence des périodes',!ranges.length?'inconnu':reversed?'attention':'ok',!ranges.length?'Aucune période complète au format année–année repérée.':reversed?'Une fin de période précède son début.':'Aucune période numérique inversée repérée. Les chevauchements et la durée par technologie ne sont pas évalués.',reversed?.quote);
 if(reversed)issue('date_ranges','chronologie','Une période semble inversée','Vérifie les deux années et indique le début avant la fin, en conservant les dates réelles.',reversed.quote);
 const spaced=source.match(/(?:\p{Lu}[ \t]+){4,}\p{Lu}/u)?.[0];
 add('spaced_letters','Lettres espacées',spaced?'attention':'ok',spaced?'Des lettres séparées peuvent gêner la recherche textuelle. Vérifie si cela vient de l\'extraction.':'Aucune suite d\'au moins cinq majuscules séparées par des espaces repérée.',spaced);
 const broken=source.includes('\uFFFD');
 add('encoding','Caractères de remplacement',broken?'attention':'ok',broken?'Le caractère « � » indique une perte possible lors de l\'extraction.':'Aucun caractère de remplacement « � » repéré ; les autres erreurs d\'extraction restent possibles.');
 if(broken)issue('encoding','typographie','Un caractère du texte n\'a pas été reconnu','Compare le texte avec le document et remplace « � » par le caractère original.','�');
 const phrases=experiencePhrases(source),unusual=phrases.filter(s=>countWords(s)<6||countWords(s)>38);
 add('sentence_length','Longueur des phrases d\'expérience',!phrases.length?'inconnu':unusual.length?'attention':'ok',!phrases.length?'Aucune phrase d\'expérience reconnue.':`${unusual.length}/${phrases.length} phrases repérées hors de l'intervalle indicatif 6–38 mots. Ce repère ne provoque aucune pénalité.`);
 const repeated=lines.find((s,i)=>countWords(s)>=6&&normalized.indexOf(normalized[i])<i);
 add('repeated_lines','Lignes répétées',repeated?'attention':'ok',repeated?'Une ligne d\'au moins six mots apparaît plusieurs fois. Vérifie s\'il s\'agit d\'une répétition utile ou d\'un en-tête de page.':'Aucune ligne identique d\'au moins six mots repérée.',repeated);
 const project=section(/^projets?(?: personnels?|professionnels?|academiques?)?$/);
 const nextSection=project<0?-1:normalized.findIndex((s,i)=>i>project&&/^(?:formations?|competences?|experiences?|langues?|qualites)$/.test(s));
 const content=project<0?[]:lines.slice(project+1,nextSection<0?undefined:nextSection);
 const urlOnly=content.length===1&&/^(?:https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/\S*)?$/i.test(content[0]);
 add('project_details','Description des projets',project<0?'inconnu':urlOnly?'attention':content.length?'ok':'attention',project<0?'Pas de rubrique projets reconnue ; cette rubrique est facultative.':urlOnly?'La rubrique se limite à un lien. Décris le projet, ta contribution et les outils réellement utilisés.':content.length?'Du contenu est présent ; la qualité de la description relève de la relecture.':'La rubrique paraît vide.');
 if(urlOnly)issue('project_details','realisations','Un projet est présenté uniquement par un lien','Ajoute une phrase précisant le projet, ton rôle et un livrable réel. Garde le lien pour permettre au recruteur d\'explorer le résultat.',content[0]);
 return {checks,issues};
}
