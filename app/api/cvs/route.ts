import { requireUser, tokenFromRequest } from '@/lib/auth/session';
import { userDataClient } from '@/lib/auth/supabase';
import { authError } from '@/lib/auth/validation';
import { dataError } from '@/lib/data/usage';
import { saveSchema } from '@/lib/data/saves';
import { checkOrigin, json, readLimited, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET(req:Request) {
  try {
    const user=await requireUser(req);
    const {data,error}=await userDataClient(tokenFromRequest(req)).from('cvats_saved_cvs').select('id,name,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(20);
    dataError(error);return json({saves:data});
  }catch(error){return authError(error);}
}
export async function POST(req:Request) {
  try {
    checkOrigin(req);await requireUser(req);
    let body;try{body=JSON.parse(new TextDecoder().decode(await readLimited(req,600000)));}catch(error){if(error instanceof PublicError)throw error;throw new PublicError('Sauvegarde illisible.');}
    const parsed=saveSchema.safeParse(body);
    if(!parsed.success)throw new PublicError('Donne un nom à la sauvegarde et un CV de 30 à 40 000 caractères.');
    const {name,cv,job,result}=parsed.data;
    if(result && Buffer.byteLength(JSON.stringify(result))>200000)throw new PublicError('Le résultat est trop volumineux pour être sauvegardé. Enregistre uniquement le texte du CV.');
    const {data,error}=await userDataClient(tokenFromRequest(req)).rpc('cvats_save_cv',{p_name:name,p_cv:cv,p_job:job,p_result:result});
    dataError(error);return json({id:data},201);
  }catch(error){return authError(error);}
}
