import { z } from 'zod';
import { authClient } from '@/lib/auth/supabase';
import { sessionCookie, userFromToken } from '@/lib/auth/session';
import { emailSchema, bodyOf, authError } from '@/lib/auth/validation';
import { checkOrigin, json, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    const input = z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict().parse(await bodyOf(req));
    const { data, error } = await authClient().auth.signInWithPassword(input);
    if (error || !data.session) {
      if (error?.status === 429) throw new PublicError('Trop de tentatives. Attends quelques minutes avant de réessayer.', 429);
      throw new PublicError('Connexion impossible. Vérifie tes identifiants et que ton compte est autorisé.', 401);
    }
    const user = await userFromToken(data.session.access_token, true);
    const response = json({ redirect: user.mustChangePassword ? '/compte' : '/' });
    response.headers.set('Set-Cookie', sessionCookie(data.session.access_token, data.session.expires_in));
    return response;
  } catch (error) { return authError(error); }
}
