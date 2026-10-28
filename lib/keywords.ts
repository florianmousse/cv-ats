export type KeywordGroup={title:string;terms:string[]};
export const keywordGuides:Record<string,{label:string;groups:KeywordGroup[]}>={
 web:{label:'Développement web',groups:[
  {title:'Intitulés à comparer à ton offre',terms:['Développeur web','Développeur front-end','Développeur back-end','Développeur full-stack']},
  {title:'Front-end et mobile',terms:['HTML','CSS','Sass','JavaScript','TypeScript','React','Angular','RxJS','Vue.js','Next.js','Nuxt','Twig','Flutter','React Native']},
  {title:'Back-end et données',terms:['Java','Spring Boot','Hibernate','PHP','Symfony','Laravel','Node.js','Express','NestJS','Python','Django','FastAPI','C#','.NET','C++','SQL','PostgreSQL','MySQL','MongoDB','Redis','Appwrite']},
  {title:'Tests et qualité',terms:['Tests unitaires','Tests d\'intégration','JUnit','PHPUnit','Behat','Jest','Vitest','Cypress','Playwright','Selenium','SonarQube','Accessibilité','Revue de code','Recette']},
  {title:'Livraison et outils',terms:['Git','GitLab','GitHub','Maven','Gradle','Jenkins','CI/CD','Intégration continue','Livraison continue','Déploiement continu','Pipeline multibranches','Nexus','Docker','Kubernetes','API REST','GraphQL','Microservices']},
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
 infra:{label:'Infrastructure, cloud et cybersécurité',groups:[
  {title:'Systèmes et réseaux',terms:['Linux','Windows Server','Active Directory','TCP/IP','DNS','VPN','Réseaux','Virtualisation','VMware','Bash','PowerShell']},
  {title:'Cloud et exploitation',terms:['AWS','Azure','GCP','Terraform','Ansible','Docker','Kubernetes','CI/CD','Prometheus','Grafana','Supervision','Support','Maintenance applicative']},
  {title:'Sécurité',terms:['Cybersécurité','Sécurité informatique','Pentest','SOC','SIEM','IAM','OWASP','ISO 27001','Analyse de risques','Gestion des incidents']},
 ]},
 transversal:{label:'Missions, langues et qualités',groups:[
  {title:'Missions et contexte',terms:['Développement','Intégration','Accompagnement des développeurs','Conception','Spécifications techniques','Documentation','Finance','ERP','Cloud','Testing']},
  {title:'Qualités à illustrer',terms:['Autonomie','Rigueur','Adaptation','Esprit d\'équipe','Analyse','Synthèse','Communication','Gestion de projet','Méthodes agiles']},
  {title:'Langues',terms:['Anglais','Allemand','Espagnol','Français','TOEIC','Bilingue','A1','A2','B1','B2','C1','C2']},
 ]},
};

// Literal word boundaries prevent Java matching JavaScript or SQL matching NoSQL.
// Normalise accents and typography, but never infer a skill from a related tool.
export function normalizeKeyword(text:string){return text.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('fr').replace(/[\u2019‘]/g,"'").replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();}
const normalize=normalizeKeyword;
export function containsKeyword(text:string,keyword:string){
 return containsNormalized(normalize(text),keyword);
}
function containsNormalized(source:string,keyword:string){
 const term=normalize(keyword);if(!term)return false;
 const escaped=term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(^|[^\\p{L}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{N}_])`,'u').test(source);
}
export function customKeywords(value:string){return [...new Set(value.split(/[,;\n]/).map(t=>t.trim()).filter(Boolean))].slice(0,30);}

// Only spelling variants and narrow equivalents. Related tools are NOT synonyms.
const aliases:Record<string,string[]>={
 React:['React','ReactJS','React.js'], 'Vue.js':['Vue.js','VueJS','Vue'], 'Node.js':['Node.js','NodeJS'],
 JavaScript:['JavaScript','Javascript'], TypeScript:['TypeScript'], 'CI/CD':['CI/CD','CI / CD'],
 'Pipeline multibranches':['Pipeline multibranches','Pipelines multibranches','Multibranch pipeline'],
 'Esprit d\'équipe':['Esprit d\'équipe','Travail en équipe','Travailler en équipe'],
 Autonomie:['Autonomie','Autonome'], Rigueur:['Rigueur','Rigoureux','Rigoureuse'],
 'API REST':['API REST','API RESTful'], 'Tests unitaires':['Tests unitaires','Test unitaire','Unit testing'],
};
const aliasLookup=new Map(Object.entries(aliases).flatMap(([canonical,variants])=>variants.map(variant=>[normalize(variant),canonical] as const)));
export function canonicalKeyword(term:string){
 return aliasLookup.get(normalize(term))??term.trim();
}
export function hasKeyword(text:string,term:string){
 return keywordMatcher(text)(term);
}
export function keywordMatcher(text:string){
 const normalized=normalize(text);
 // This closure is scoped to the caller; CV text is never put in a shared cache.
 return (term:string)=>{
  const canonical=canonicalKeyword(term);
  const source=canonical==='React'?normalized.replace(/\breact\s+native\b/g,''):normalized;
  return (aliases[canonical]??[canonical]).some(variant=>containsNormalized(source,variant));
 };
}
export function uniqueKeywords(terms:string[]){
 const seen=new Set<string>();return terms.filter(term=>{const key=normalize(canonicalKeyword(term));if(!key||seen.has(key))return false;seen.add(key);return true;});
}
export function extractJobKeywords(job:string){
 const catalog=Object.values(keywordGuides).flatMap(g=>g.groups.flatMap(group=>group.terms));
 const terms=catalog.filter(keywordMatcher(job));
 // Versions remain distinct requirements: mentioning Angular alone does not prove Angular 14.
 const versions=job.match(/\b(?:Angular|Java|Python|React(?:JS)?|Spring Boot|PHP|Node\.js|\.NET)\s+v?\d+(?:\.\d+){0,2}\b/gi)??[];
 return uniqueKeywords([...terms,...versions]);
}
