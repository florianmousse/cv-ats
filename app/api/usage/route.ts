import { requireUser } from '@/lib/auth/session';
import { authError } from '@/lib/auth/validation';
import { userUsage } from '@/lib/data/usage';
import {keyStatus} from '@/lib/keys/personal';
import { json } from '@/lib/http';
export async function GET(req:Request){try{const user=await requireUser(req);const [usages,settings]=await Promise.all([userUsage([user.id]),keyStatus(user.id)]);return json({usage:usages[0],settings});}catch(error){return authError(error);}}
