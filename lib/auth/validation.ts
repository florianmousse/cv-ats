import { z } from 'zod';
import { PublicError, readLimited, json } from '@/lib/http';
export const passwordSchema = z.string().min(12, 'Le mot de passe doit contenir au moins 12 caractères.').max(128);
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export async function bodyOf(req: Request) {
  try { return JSON.parse(new TextDecoder().decode(await readLimited(req, 8192))); }
  catch (error) { if (error instanceof PublicError) throw error; throw new PublicError('Le formulaire est illisible.'); }
}
export function authError(error: unknown) {
  if (error instanceof PublicError) return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return json({ error: 'Vérifie les champs du formulaire (adresse e-mail valide, mot de passe de 12 à 128 caractères).' }, 400);
  return json({ error: 'L’opération n’a pas abouti. Réessaie.' }, 503);
}
