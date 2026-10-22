import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {documentFactsSchema,type DocumentFacts} from './document-facts';

const payloadSchema=z.object({version:z.literal(1),owner:z.string(),digest:z.string().length(64),expires:z.number().int(),facts:documentFactsSchema}).strict();
const digest=(text:string)=>createHash('sha256').update(text.trim()).digest('hex');
// Server-only attestation, domain-separated from all other uses of this server secret.
function signature(payload:string,secret:string){return createHmac('sha256',secret).update('cvats:import-proof:v1:'+payload).digest();}
export function createImportProof(owner:string,text:string,facts:DocumentFacts,secret=process.env.SUPABASE_SERVICE_ROLE_KEY,now=Date.now()){
 if(!secret)throw new Error('Import attestation unavailable');
 const checked=documentFactsSchema.parse(facts);
 if(checked.format==='pdf'&&checked.pages!==checked.charactersPerPage.length)throw new Error('Invalid page metadata');
 const payload=Buffer.from(JSON.stringify({version:1,owner,digest:digest(text),expires:now+3600_000,facts:checked})).toString('base64url');
 return payload+'.'+signature(payload,secret).toString('base64url');
}
export function verifyImportProof(proof:string|undefined,owner:string,text:string,secret=process.env.SUPABASE_SERVICE_ROLE_KEY,now=Date.now()):DocumentFacts|undefined{
 if(!proof||!secret||proof.length>4000)return;
 try{
  const [payload,mac,extra]=proof.split('.');if(extra!==undefined||!payload||!mac)return;
  const received=Buffer.from(mac,'base64url'),expected=signature(payload,secret);
  if(received.length!==expected.length||!timingSafeEqual(received,expected))return;
  const parsed=payloadSchema.parse(JSON.parse(Buffer.from(payload,'base64url').toString('utf8')));
  if(parsed.owner!==owner||parsed.digest!==digest(text)||parsed.expires<=now)return;
  if(parsed.facts.format==='pdf'&&parsed.facts.pages!==parsed.facts.charactersPerPage.length)return;
  return parsed.facts;
 }catch{return;}
}
