import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { authError, bodyOf } from '@/lib/auth/validation';
import { rpc } from '@/lib/data/usage';
import { checkOrigin, json } from '@/lib/http';
export async function PATCH(req:Request,ctx:{params:Promise<{id:string}>}){try{
 checkOrigin(req);await requireAdmin(req);
 const {id}=await ctx.params;z.string().uuid().parse(id);
 const {limit}=z.object({limit:z.number().int().min(0).max(1000000)}).strict().parse(await bodyOf(req));
 await rpc('cvats_set_quota',{p_user:id,p_limit:limit});return json({ok:true});
}catch(error){return authError(error);}}
