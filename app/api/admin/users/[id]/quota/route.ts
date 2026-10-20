import {requireAdmin} from '@/lib/auth/session';
import {authError} from '@/lib/auth/validation';
import {checkOrigin,json} from '@/lib/http';
export async function PATCH(req:Request){try{checkOrigin(req);await requireAdmin(req);return json({error:'Les quotas internes ont été supprimés. Cette route ne modifie plus de plafond.'},410);}catch(error){return authError(error);}}
