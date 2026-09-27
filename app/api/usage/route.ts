import { requireUser } from '@/lib/auth/session';
import { authError } from '@/lib/auth/validation';
import { userUsage } from '@/lib/data/usage';
import { json } from '@/lib/http';
export async function GET(req:Request){try{const user=await requireUser(req);return json({usage:(await userUsage([user.id]))[0]});}catch(error){return authError(error);}}
