import {requireUser} from '@/lib/auth/session';
import {authError,bodyOf} from '@/lib/auth/validation';
import {keyStatus,savePersonalKey,deletePersonalKey,personalKeySchema} from '@/lib/keys/personal';
import {checkOrigin,json,PublicError} from '@/lib/http';
export const runtime='nodejs';
export async function GET(req:Request){try{const user=await requireUser(req);return json({settings:await keyStatus(user.id)});}catch(error){return authError(error);}}
export async function PUT(req:Request){try{
 checkOrigin(req);const user=await requireUser(req);
 const parsed=personalKeySchema.safeParse(await bodyOf(req));
 if(!parsed.success)throw new PublicError('Vérifie la clé Gemini et le nom du modèle. Ne colle pas de commande, d’URL ou d’espace dans la clé.');
 await savePersonalKey(user.id,parsed.data.apiKey,parsed.data.model);
 return json({ok:true}); // No plaintext, ciphertext or upstream validation response.
}catch(error){return authError(error);}}
export async function DELETE(req:Request){try{
 checkOrigin(req);const user=await requireUser(req);await deletePersonalKey(user.id);return json({ok:true});
}catch(error){return authError(error);}}
