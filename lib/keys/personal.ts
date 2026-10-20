import {z} from 'zod';
import {adminClient} from '@/lib/auth/supabase';
import {DEFAULT_MODEL} from '@/lib/gemini';
import {PublicError} from '@/lib/http';
import {decryptKey,encryptionConfigured,encryptKey} from './crypto';

export type KeySource='personal'|'shared';
export type KeyStatus={hasPersonalKey:boolean;hint:string|null;model:string;updatedAt:string|null;canSave:boolean;sharedAvailable:boolean};
export const personalKeySchema=z.object({
 apiKey:z.string().trim().min(16).max(512).regex(/^[A-Za-z0-9_.-]+$/),
 model:z.string().trim().max(100).refine(v=>v===''||/^gemini-[a-zA-Z0-9.-]+$/.test(v)).default(''),
}).strict();
function unavailable():never{throw new PublicError('La configuration Gemini est indisponible. Vérifie la migration SQL 002 et la connexion à Supabase. Aucun appel Gemini n’a été effectué.',503);}
export async function keyStatus(userId:string):Promise<KeyStatus>{
 const {data,error}=await adminClient().from('cvats_personal_keys').select('key_hint,model,updated_at').eq('user_id',userId).maybeSingle();
 if(error)unavailable();
 return {hasPersonalKey:!!data,hint:data?.key_hint??null,model:data?.model||process.env.GEMINI_MODEL?.trim()||DEFAULT_MODEL,updatedAt:data?.updated_at??null,canSave:encryptionConfigured(),sharedAvailable:!!process.env.GEMINI_API_KEY?.trim()};
}
export async function savePersonalKey(userId:string,apiKey:string,model:string){
 const encrypted=encryptKey(apiKey,userId);
 const {error}=await adminClient().from('cvats_personal_keys').upsert({user_id:userId,encrypted_key:encrypted,key_hint:apiKey.slice(-4),model,updated_at:new Date().toISOString()},{onConflict:'user_id'});
 if(error)unavailable();
}
export async function deletePersonalKey(userId:string){
 const {error}=await adminClient().from('cvats_personal_keys').delete().eq('user_id',userId);
 if(error)unavailable();
}
/** A stored personal key always wins. Read/decrypt/provider errors must NOT use
 * the shared key, even when one is available. Resolve once for generation+audit. */
export async function geminiSettings(userId:string):Promise<{apiKey:string;model:string;source:KeySource}>{
 const {data,error}=await adminClient().from('cvats_personal_keys').select('encrypted_key,model').eq('user_id',userId).maybeSingle();
 if(error)unavailable();
 if(data)return {apiKey:decryptKey(data.encrypted_key,userId),model:data.model||process.env.GEMINI_MODEL?.trim()||DEFAULT_MODEL,source:'personal'};
 const apiKey=process.env.GEMINI_API_KEY?.trim()??'';
 if(!apiKey)throw new PublicError('Ajoute ta clé Gemini dans Mon compte pour lancer une analyse. Aucune clé partagée n’est configurée.',503);
 return {apiKey,model:process.env.GEMINI_MODEL?.trim()||DEFAULT_MODEL,source:'shared'};
}
