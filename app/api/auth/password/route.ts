import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { authClient, adminClient } from '@/lib/auth/supabase';
import { requireUser, sessionCookie } from '@/lib/auth/session';
import { bodyOf, passwordSchema, authError } from '@/lib/auth/validation';
import { checkOrigin, json, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const user = await requireUser(req, true);
    const input = z.object({ currentPassword: z.string().min(1).max(128), password: passwordSchema }).strict().parse(await bodyOf(req));
    if (input.currentPassword === input.password) throw new PublicError('Choisis un nouveau mot de passe différent du précédent.');
    const { data, error: verificationError } = await authClient().auth.signInWithPassword({ email: user.email, password: input.currentPassword });
    if (verificationError || data.user?.id !== user.id) throw new PublicError('Le mot de passe actuel est incorrect ou la vérification est temporairement indisponible.', 400);
    // Recheck current permissions after password verification, before mutation.
    await requireUser(req, true);
    const { error } = await adminClient().auth.admin.updateUserById(user.id, { password: input.password, app_metadata: { must_change_password: false, access_version: randomUUID() } });
    if (error) throw new PublicError('Le mot de passe n’a pas pu être changé. Vérifie les exigences de sécurité puis réessaie.');
    const response = json({ ok: true });
    response.headers.set('Set-Cookie', sessionCookie('', 0));
    return response;
  } catch (error) { return authError(error); }
}
