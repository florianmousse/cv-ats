import type {Scan} from './cv';

export const languageSources=[
 {label:'ETS : correspondances TOEIC / CECRL',url:'https://www.ets.org/pdfs/toeic/toeic-mapping-cefr-reference.pdf'},
 {label:'ETS : interpréter le total Listening & Reading',url:'https://www.ets.org/content/dam/ets-org/de/pdfs/toeic/mapping-cefr-toeic-listening-reading-test.pdf'},
 {label:'ETS Global : confirmation des résultats pendant deux ans',url:'https://www.etsglobal.org/pm/fr/help-center/mon-score/comment-les-tests-sont-ils-corriges'},
 {label:'Conseil de l\'Europe : niveaux du CECRL',url:'https://www.coe.int/en/web/common-European-framework-reference-languages/table-1-cefr-3.3-common-reference-levels-global-scale'},
];
type LanguageCheck={code:string;status:'info'|'attention';title:string;excerpt:string;detail:string};
const levels=['A1','A2','B1','B2','C1'] as const;
const cutoffs={listening:[60,110,275,400,490],reading:[60,115,275,385,455],total:[120,225,550,785,945]};
function cefr(score:number,part:keyof typeof cutoffs){const index=cutoffs[part].findLastIndex(min=>score>=min);return index<0?'sous le seuil A1':levels[index];}

/** Text consistency only: never authenticates a certificate or changes the user's declared level. */
export function languageChecks(source:string,year=new Date().getUTCFullYear()):LanguageCheck[]{
 const result:LanguageCheck[]=[];
 const add=(excerpt:string,code:string,title:string,detail:string,status:LanguageCheck['status']='attention')=>result.push({excerpt,code,title,detail,status});
 const lines=source.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).flatMap(line=>line.length<=1200?[line]:[...new Set([...line.matchAll(/\bbilingue\b|\bTOEIC\b/gi)].map(match=>line.slice(Math.max(0,match.index-150),match.index+800)))]);
 for(const line of lines){
  if(/\bbilingue\b/i.test(line)&&/allemand|anglais|français|espagnol|italien|portugais|arabe|chinois|japonais|russe|néerlandais|langue/i.test(line)){
   add(line,'bilingual','Préciser le niveau de langue déclaré','« Bilingue » n\'équivaut pas automatiquement à C2 et n\'est pas une certification. Garde cette mention si elle décrit ton parcours ; complète éventuellement par un niveau CECRL autoévalué et un contexte d\'usage réel, ou par le diplôme effectivement obtenu. Exemple à compléter après évaluation : « Allemand - bilingue ; niveau CECRL [à évaluer] ». Aucun rejet ATS ne peut être déduit de ce seul mot.');
  }
  if(!/\bTOEIC\b/i.test(line))continue;
  const lr=/listening\s*(?:and|&|et|\+|\/)\s*reading|\bL\s*[&/+]\s*R\b|compréhension\s+orale\s+et\s+écrite/i.test(line);
  const other=/\bBridge\b|speaking|writing|4\s*skills|4\s*compétences/i.test(line);
  const totalMatch=line.match(/\b(\d{1,4}(?:[.,]\d+)?)\s*\/\s*990\b/);
  const total=totalMatch?Number(totalMatch[1].replace(',','.')):undefined;
  const scoreFor=(part:string)=>{const match=line.match(new RegExp(`\\b${part}\\s*[:=–—-]?\\s*(\\d{1,4}(?:[.,]\\d+)?)\\s*\\/\\s*495\\b`,'i'));return match?Number(match[1].replace(',','.')):undefined;};
  const listening=scoreFor('Listening'),reading=scoreFor('Reading');
  const sectionsKnown=listening!==undefined&&reading!==undefined;
  const invalid=(score:number,min:number,max:number)=>score<min||score>max||score%5!==0;
  if(other){
   add(line,'test_variant','Vérifier la variante du TOEIC','Les barèmes diffèrent entre Listening & Reading, Speaking & Writing, Bridge et les formats combinés. Recopie la variante exacte, les scores par épreuve et les niveaux du relevé officiel ; aucune conversion globale automatique n\'est faite ici.');
  }else if(lr||totalMatch||sectionsKnown){
   if(!lr&&!sectionsKnown)add(line,'test_name','Préciser le nom du test TOEIC','Le dénominateur /990 évoque Listening & Reading. Vérifie le relevé avant d\'écrire « TOEIC Listening & Reading ». Un total seul ne certifie ni l\'expression orale ni l\'expression écrite.');
   const withoutDates=line.replace(/\b(?:\d{1,2}\s*\/\s*){1,2}(?:19|20)\d{2}\b/g,'');
   if(lr&&[...withoutDates.matchAll(/\b\d+(?:[.,]\d+)?\s*\/\s*(\d+)\b/g)].some(match=>!['495','990'].includes(match[1])))add(line,'denominator','Vérifier le dénominateur du score','Pour Listening & Reading, le total est exprimé sur 990 et chaque épreuve sur 495. Vérifie le score et la variante sur le relevé original.');
   const bad=(total!==undefined&&invalid(total,10,990))||(listening!==undefined&&invalid(listening,5,495))||(reading!==undefined&&invalid(reading,5,495));
   if(bad)add(line,'score_range','Vérifier le score TOEIC saisi','Pour TOEIC Listening & Reading : total de 10 à 990, épreuves de 5 à 495, par pas de 5. Compare la saisie au relevé ; aucun score de remplacement n\'est inventé.');
   if(!bad){
    if(sectionsKnown){
     add(line,'section_levels','Repères CECRL par épreuve',`Listening ${listening}/495 : repère ${cefr(listening,'listening')} ; Reading ${reading}/495 : repère ${cefr(reading,'reading')}. Ce sont des correspondances indicatives ETS, pas une authentification ni une évaluation de l'expression.`, 'info');
     if(total!==undefined&&listening+reading!==total)add(line,'sum','Total et sous-scores à vérifier','Le total annoncé ne correspond pas à la somme Listening + Reading. Recopie les trois valeurs du même relevé, sans les recalculer à la place du candidat.');
    }else if(total!==undefined){
     add(line,'total_level','Interpréter le total TOEIC avec prudence',`Si le test est bien Listening & Reading, ${total}/990 donne un repère global ${cefr(total,'total')}. ETS recommande de lire Listening et Reading séparément : le total ne prouve pas le même niveau dans chaque épreuve et ne mesure pas l'expression orale/écrite. Ajoute les sous-scores disponibles.`, 'info');
    }else add(line,'missing_score','Compléter le résultat du test','Ajoute le score et son dénominateur tels qu\'ils figurent sur l\'attestation, ainsi que les sous-scores disponibles. Aucun niveau CECRL n\'est déduit sans résultat.');
    const claimed=line.match(/\b([ABC][12])\b/i)?.[1]?.toUpperCase();
    if(claimed==='C2')add(line,'cefr_claim','C2 ne peut pas être déduit de ce TOEIC','La correspondance ETS de Listening & Reading va jusqu\'à C1. Si C2 est ton niveau autoévalué ou vient d\'un autre diplôme, distingue-le explicitement du résultat TOEIC. Ne remplace pas automatiquement le niveau déclaré.');
    else if(claimed&&levels.includes(claimed as typeof levels[number])){
     const index=levels.indexOf(claimed as typeof levels[number]);
     if((total!==undefined&&total<cutoffs.total[index])||(sectionsKnown&&(listening<cutoffs.listening[index]||reading<cutoffs.reading[index])))add(line,'cefr_claim','Clarifier le lien entre score et niveau déclaré',`Le relevé saisi ne soutient pas à lui seul ${claimed} pour les deux épreuves selon les repères ETS. Si ce niveau est une autoévaluation actuelle ou repose sur une autre certification, précise-le séparément du TOEIC historique. Vérifie le relevé avant toute correction.`);
    }
   }
  }else add(line,'test_details','Compléter les informations TOEIC','Précise la variante du TOEIC, le score avec son dénominateur et la date du test. N\'applique pas un barème Listening & Reading à une autre version.');
  const years=[...line.matchAll(/\b(?:19|20)\d{2}\b(?!\s*\/)/g)].map(m=>Number(m[0]));
  if(years.length===1){const date=years[0];
   if(date>year)add(line,'future_date','Date de certification à vérifier','La date indiquée est future. Si le test est prévu, écris « prévu » et ne présente pas son résultat comme obtenu.');
   else if(date<year-2)add(line,'old_score','Résultat TOEIC historique','Ce résultat date de plus de deux ans. ETS Global confirme les scores pendant deux ans après le test. Tu peux conserver le score avec sa date comme résultat historique ; vérifie si le recruteur demande un résultat récent. Cela ne signifie pas que tes compétences ont expiré.');
   else if(date===year-2)add(line,'date_precision','Vérifier la date exacte du TOEIC','L\'année seule ne permet pas de vérifier la période de deux ans de confirmation des résultats par ETS Global. Consulte le jour et le mois du relevé si un résultat récent est demandé.');
  }else if(years.length===0)add(line,'missing_date','Préciser la date du TOEIC','Ajoute au moins l\'année réelle du test pour distinguer un résultat historique d\'un niveau actuel. Le site ne vérifie pas l\'authenticité de l\'attestation.');
 }
 return result;
}
export function languageDiagnostics(source:string,year?:number):Scan['problemes']{
 return languageChecks(source,year).filter(c=>c.status==='attention').map(c=>({categorie:'competences',origine:'local',ruleId:`language_${c.code}`,severite:'faible',texte:c.title,extrait:c.excerpt,correction:c.detail}));
}
