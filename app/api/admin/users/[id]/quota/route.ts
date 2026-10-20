import {requireAdmin} from '@/lib/auth/session';
import {z} from 'zod';
import {authError,bodyOf} from '@/lib/auth/validation';
import {rpc} from '@/lib/data/usage';
import {checkOrigin,json,PublicError} from '@/lib/http';
const schema=z.object({limit:z.number().int().min(0).max(1000000).nullable()}).strict();
export async function PATCH(req:Request,context:{params:Promise<{id:string}>}){try{
 checkOrigin(req);await requireAdmin(req);
 const {id}=await context.params;
 if(!z.string().uuid().safeParse(id).success)throw new PublicError('Compte invalide.');
 const parsed=schema.safeParse(await bodyOf(req));
 if(!parsed.success)throw new PublicError('Le quota doit être un entier entre 0 et 1 000 000, ou null pour utiliser la valeur par défaut.');
 await rpc('cvats_set_quota',{p_user:id,p_limit:parsed.data.limit});
 return json({ok:true});
}catch(error){return authError(error);}}
