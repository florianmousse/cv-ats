import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { adminClient } from '@/lib/auth/supabase';
import { authError, bodyOf } from '@/lib/auth/validation';
import { adminUsage, dataError } from '@/lib/data/usage';
import { checkOrigin, json } from '@/lib/http';
export async function GET(req:Request){try{await requireAdmin(req);return json({usage:await adminUsage()});}catch(error){return authError(error);}}
export async function PATCH(req:Request){try{
 checkOrigin(req);await requireAdmin(req);
 const {limit}=z.object({limit:z.number().int().min(0).max(1000000)}).strict().parse(await bodyOf(req));
 const {error}=await adminClient().from('cvats_quota_settings').update({daily_limit:limit}).eq('id',true);dataError(error);
 return json({ok:true});
}catch(error){return authError(error);}}
