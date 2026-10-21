import {type CV,cvSchema} from './cv';
import {extractJobKeywords} from './keywords';

export function moveItem<T>(items:T[],index:number,direction:-1|1):T[]{
 const target=index+direction;if(index<0||index>=items.length||target<0||target>=items.length)return items;
 const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next;
}
export function jobKeywords(job:string){return extractJobKeywords(job); }
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
