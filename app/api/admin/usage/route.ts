import { requireAdmin } from '@/lib/auth/session';
import { authError } from '@/lib/auth/validation';
import { adminUsage } from '@/lib/data/usage';
import { checkOrigin, json } from '@/lib/http';
export async function GET(req:Request){try{await requireAdmin(req);return json({usage:await adminUsage()});}catch(error){return authError(error);}}
export async function PATCH(req:Request){try{
 checkOrigin(req);await requireAdmin(req);return json({error:'Les plafonds internes ont été supprimés. Seules les limites Gemini s’appliquent.'},410);
}catch(error){return authError(error);}}
