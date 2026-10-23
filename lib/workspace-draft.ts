import {z} from 'zod';
import {scanSchema,toPlainText} from './cv';
import {optimizedSchema} from './data/saves';

export const workspaceSchema=z.object({
 source:z.string().max(40000),text:z.string().max(40000),job:z.string().max(30000),filename:z.string().max(255),
 draft:optimizedSchema.nullable(),scan:z.object({data:scanSchema,cv:z.string().max(40000),job:z.string().max(30000)}).strict().nullable(),
 letter:z.string().max(16000),letterCV:z.string().max(40000),letterJob:z.string().max(30000),notes:z.string().max(4000),
 tab:z.enum(['cv','diagnostic','letter','tools']),
}).strict();
export type WorkspaceDraft=z.infer<typeof workspaceSchema>;
export const emptyWorkspace=():WorkspaceDraft=>({source:'',text:'',job:'',filename:'',draft:null,scan:null,letter:'',letterCV:'',letterJob:'',notes:'',tab:'cv'});
export const currentCV=(state:WorkspaceDraft)=>state.draft?toPlainText(state.draft.data,state.draft.headings):state.text;
export const isScanStale=(state:WorkspaceDraft)=>Boolean(state.scan&&(state.scan.cv!==currentCV(state)||state.scan.job!==state.job));
export const cacheKey=(userId:string)=>`cvats:workspace:v1:${userId}`;
export const CACHE_TTL=7*24*3600_000;
const envelope=z.object({version:z.literal(1),owner:z.string(),savedAt:z.number(),state:workspaceSchema}).strict();
export function encodeDraft(owner:string,state:WorkspaceDraft,now=Date.now()){
 const value=JSON.stringify({version:1,owner,savedAt:now,state:workspaceSchema.parse(state)});
 if(value.length>1_500_000)throw new Error('Brouillon trop volumineux pour le cache local.');return value;
}
export function decodeDraft(value:string|null,owner:string,now=Date.now()):WorkspaceDraft|null{
 if(!value||value.length>1_500_000)return null;
 try{const parsed=envelope.parse(JSON.parse(value));return parsed.owner===owner&&parsed.savedAt<=now&&now-parsed.savedAt<CACHE_TTL?parsed.state:null;}catch{return null;}
}
export function clearWorkspaceCache(owner:string){
 window.dispatchEvent(new Event('cvats:logout'));
 try{localStorage.removeItem(cacheKey(owner));}catch{/* Storage may be unavailable. */}
}
