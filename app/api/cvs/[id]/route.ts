import { z } from 'zod';
import { requireUser, tokenFromRequest } from '@/lib/auth/session';
import { userDataClient } from '@/lib/auth/supabase';
import { authError } from '@/lib/auth/validation';
import { dataError } from '@/lib/data/usage';
import { saveSchema } from '@/lib/data/saves';
import { checkOrigin, json, PublicError } from '@/lib/http';
type Context={params:Promise<{id:string}>};
export const runtime='nodejs';
async function query(req:Request,ctx:Context){
 const user=await requireUser(req);const {id}=await ctx.params;
 if(!z.string().uuid().safeParse(id).success)throw new PublicError('Sauvegarde introuvable.',404);
 return {id,user,client:userDataClient(tokenFromRequest(req))};
}
export async function GET(req:Request,ctx:Context){try{
 const {id,user,client}=await query(req,ctx);
 const {data,error}=await client.from('cvats_saved_cvs').select('id,name,cv,job,result,created_at').eq('id',id).eq('user_id',user.id).maybeSingle();
 dataError(error);if(!data)throw new PublicError('Sauvegarde introuvable.',404);
 // Direct REST writes cannot smuggle an invalid structured result into the UI.
 const checked=saveSchema.safeParse({name:data.name,cv:data.cv,job:data.job,result:data.result});
 if(!checked.success)throw new PublicError('Cette sauvegarde est incompatible avec cette version.',422);
 return json({save:{...checked.data,id:data.id,created_at:data.created_at}});
}catch(error){return authError(error);}}
export async function DELETE(req:Request,ctx:Context){try{
 checkOrigin(req);const {id,user,client}=await query(req,ctx);
 const {data,error}=await client.from('cvats_saved_cvs').delete().eq('id',id).eq('user_id',user.id).select('id');
 dataError(error);if(!data?.length)throw new PublicError('Sauvegarde introuvable.',404);
 return json({ok:true});
}catch(error){return authError(error);}}
