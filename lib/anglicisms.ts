import type {Scan} from './cv';
/** Editorial alternatives for French prose, never automatic technology/title substitutions. */
export function anglicisms(source:string):Scan['problemes']{
 if(!/\b(?:compétences|formation|développement|équipe|expériences?|gestion|projet|français)\b/i.test(source))return [];
 const alternatives=[[/\bmanagement(?: d[\u2019']équipe)?\b/i,'encadrement d\'équipe ou gestion, selon le sens'],[/\bfeedbacks?\b/i,'retour ou retour d\'expérience'],[/\bdeadlines?\b/i,'échéance ou date limite'],[/\breporting\b/i,'suivi d\'activité ou production de rapports'],[/\bchallenges?\b/i,'défi ou enjeu'],[/\bskills\b/i,'compétences']] as const;
 return alternatives.flatMap(([pattern,replacement])=>{
  const line=source.split(/\r?\n/).find(s=>pattern.test(s));if(!line)return [];
  const term=line.match(pattern)![0];
  return [{categorie:'clarte' as const,severite:'faible' as const,origine:'local' as const,ruleId:'anglicisme',texte:`Anglicisme à examiner : « ${term} »`,extrait:line,correction:`Dans un CV rédigé en français, envisage « ${replacement} » à la place de « ${term} ». Choisis selon le contexte. Conserve les noms de produits, diplômes et intitulés contractuels exacts, ainsi que le terme de l'annonce lorsqu'il est utile. Ce conseil de langue n'est pas une faute certaine.`}];
 });
}
