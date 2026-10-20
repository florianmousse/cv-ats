export type KeywordGroup={title:string;terms:string[]};
export const keywordGuides:Record<string,{label:string;groups:KeywordGroup[]}>={
 web:{label:'Développement web',groups:[
  {title:'Intitulés à comparer à ton offre',terms:['Développeur web','Développeur front-end','Développeur back-end','Développeur full-stack']},
  {title:'Langages et frameworks',terms:['JavaScript','TypeScript','React','Node.js','PHP','Symfony','SQL']},
  {title:'Pratiques et outils',terms:['Git','Docker','CI/CD','Tests unitaires','Accessibilité','API REST','Revue de code']},
 ]},
 data:{label:'Analyse de données',groups:[
  {title:'Intitulés à comparer à ton offre',terms:['Data analyst','Analyste de données','Business analyst']},
  {title:'Outils et méthodes',terms:['SQL','Python','Excel','Power BI','Tableau','Statistiques','Visualisation de données']},
  {title:'Contributions',terms:['Tableaux de bord','Qualité des données','Reporting','Indicateurs de performance']},
 ]},
 projet:{label:'Gestion de projet',groups:[
  {title:'Intitulés à comparer à ton offre',terms:['Chef de projet','Product owner','Project manager']},
  {title:'Méthodes et outils',terms:['Scrum','Kanban','Jira','Gestion des risques','Planification']},
  {title:'Contributions',terms:['Cahier des charges','Coordination','Suivi budgétaire','Recette','Conduite du changement']},
 ]},
 commercial:{label:'Commerce et relation client',groups:[
  {title:'Intitulés à comparer à ton offre',terms:['Commercial','Chargé de clientèle','Account manager']},
  {title:'Méthodes et outils',terms:['CRM','Salesforce','Prospection','Négociation','Suivi commercial']},
  {title:'Contributions',terms:['Fidélisation','Portefeuille clients','Développement commercial','Service client']},
 ]},
};

// Literal word boundaries prevent Java matching JavaScript or SQL matching NoSQL.
// Normalise accents and typography, but never infer a skill from a related tool.
function normalize(text:string){return text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr').replace(/[’‘]/g,"'").replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();}
export function containsKeyword(text:string,keyword:string){
 const term=normalize(keyword);if(!term)return false;
 const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,'u').test(normalize(text));
}
export function customKeywords(value:string){return [...new Set(value.split(/[,;\n]/).map(t=>t.trim()).filter(Boolean))].slice(0,30);}
