import {type CV,cvSchema} from './cv';
import {containsKeyword,keywordGuides} from './keywords';

export function moveItem<T>(items:T[],index:number,direction:-1|1):T[]{
 const target=index+direction;if(index<0||index>=items.length||target<0||target>=items.length)return items;
 const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next;
}
export function jobKeywords(job:string){
 const terms=[...new Set(Object.values(keywordGuides).flatMap(g=>g.groups.flatMap(group=>group.terms)))];
 return terms.filter(term=>containsKeyword(job,term));
}
export function updateCV(cv:CV,patch:Partial<CV>):CV{return cvSchema.parse({...cv,...patch});}
export type EditHistory<T>={past:T[];present:T;future:T[]};
export function remember<T>(state:EditHistory<T>,next:T):EditHistory<T>{
 if(JSON.stringify(next)===JSON.stringify(state.present))return state;
 return {past:[...state.past,state.present].slice(-50),present:next,future:[]};
}
export function undo<T>(state:EditHistory<T>):EditHistory<T>{
 if(!state.past.length)return state;
 return {past:state.past.slice(0,-1),present:state.past.at(-1)!,future:[state.present,...state.future]};
}
export function redo<T>(state:EditHistory<T>):EditHistory<T>{
 if(!state.future.length)return state;
 return {past:[...state.past,state.present],present:state.future[0],future:state.future.slice(1)};
}
