import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import {PublicError} from '@/lib/http';

/** Encryption secret belongs in server environment variables, never in Supabase. */
function encryptionSecret():Buffer {
 const raw=process.env.API_KEY_ENCRYPTION_SECRET?.trim()??'';
 const secret=Buffer.from(raw,'base64');
 if(secret.length!==32||secret.toString('base64')!==raw)throw new PublicError('Le chiffrement des clés personnelles n’est pas configuré. Le propriétaire doit définir API_KEY_ENCRYPTION_SECRET côté serveur.',503);
 return secret;
}
export function encryptionConfigured(){try{encryptionSecret();return true;}catch{return false;}}
export function encryptKey(apiKey:string,userId:string):string{
 const iv=randomBytes(12);const cipher=createCipheriv('aes-256-gcm',encryptionSecret(),iv);
 cipher.setAAD(Buffer.from('cvats:gemini:'+userId));
 const encrypted=Buffer.concat([cipher.update(apiKey,'utf8'),cipher.final()]);
 return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),encrypted.toString('base64')].join('.');
}
export function decryptKey(envelope:string,userId:string):string{
 const secret=encryptionSecret();
 try{
  const parts=envelope.split('.');if(parts.length!==4||parts[0]!=='v1')throw new Error('invalid envelope');
  const [,iv,tag,ciphertext]=parts.map((p,i)=>i===0?Buffer.alloc(0):Buffer.from(p,'base64'));
  if(iv.length!==12||tag.length!==16||!ciphertext.length)throw new Error('invalid envelope');
  const decipher=createDecipheriv('aes-256-gcm',secret,iv);
  decipher.setAAD(Buffer.from('cvats:gemini:'+userId));decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext),decipher.final()]).toString('utf8');
 }catch{throw new PublicError('Ta clé personnelle ne peut pas être déchiffrée. Remplace-la dans Mon compte ou contacte le propriétaire. La clé du site n’a pas été utilisée.',503);}
}
