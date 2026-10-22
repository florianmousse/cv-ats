import type {Scan} from './cv';
import type {ScoreDimension} from './diagnostic-schema';
const mapping:Record<string,ScoreDimension>={orthographe:'clarte',typographie:'ats',formulations:'clarte',realisations:'impact',structure:'structure',chronologie:'structure',competences:'completude',densite:'completude',clarte:'clarte',adequation:'completude'};
const weights:Record<string,number>={email:4,date_ranges:3,encoding:3};
export function scoreIssues(issues:Scan['problemes']){
 const dimensions={structure:20,impact:20,ats:20,clarte:20,completude:20};
 const weighted=issues.map(p=>{
  const dimension:ScoreDimension=p.ruleId==='email'?'completude':mapping[p.categorie??'clarte'];
  // Missing headings, counts, dates order and job fit are review prompts, not proven defects.
  const points=p.categorie==='adequation'||p.categorie==='densite'?0:p.origine==='local'?(p.ruleId?weights[p.ruleId]??0:p.categorie==='orthographe'?2:p.categorie==='typographie'&&/lettres séparées/.test(p.texte)?2:0):({'élevée':3,moyenne:2,faible:1}[p.severite]);
  return {...p,dimension,points};
 }).sort((a,b)=>b.points-a.points||a.texte.localeCompare(b.texte,'fr')).slice(0,60);
 const problems=weighted.map(p=>{const points=Math.min(dimensions[p.dimension],p.points);dimensions[p.dimension]-=points;return {...p,points};});
 return {problemes:problems,dimensions,score:Object.values(dimensions).reduce((a,b)=>a+b,0)};
}
