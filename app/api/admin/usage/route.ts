import { requireAdmin } from '@/lib/auth/session';
import { z } from 'zod';
import { authError, bodyOf } from '@/lib/auth/validation';
import { adminUsage, rpc } from '@/lib/data/usage';
import { checkOrigin, json, PublicError } from '@/lib/http';
const policySchema=z.object({dailyLimit:z.number().int().min(0).max(1000000),defaultMonthlyLimit:z.number().int().min(0).max(1000000)}).strict();
export async function GET(req:Request){try{await requireAdmin(req);return json({usage:await adminUsage()});}catch(error){return authError(error);}}
export async function PATCH(req:Request){try{
 checkOrigin(req);await requireAdmin(req);
 const parsed=policySchema.safeParse(await bodyOf(req));
 if(!parsed.success)throw new PublicError('Les quotas doivent être des nombres entiers entre 0 et 1 000 000.');
 await rpc('cvats_set_shared_policy',{p_daily:parsed.data.dailyLimit,p_monthly:parsed.data.defaultMonthlyLimit});
 return json({ok:true});
}catch(error){return authError(error);}}
