import { randomUUID } from 'node:crypto';
import { adminClient } from '@/lib/auth/supabase';
import { requireUser, sessionCookie } from '@/lib/auth/session';
import { authError } from '@/lib/auth/validation';
import { checkOrigin, json, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    try {
      const user = await requireUser(req, true);
      const { error } = await adminClient().auth.admin.updateUserById(user.id, { app_metadata: { access_version: randomUUID() } });
      if (error) throw new PublicError('La déconnexion n’a pas abouti. Réessaie.', 503);
    } catch (error) {
      if (!(error instanceof PublicError) || ![401, 403].includes(error.status)) throw error;
    }
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  } catch (error) { return authError(error); }
}
