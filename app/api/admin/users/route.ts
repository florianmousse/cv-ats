import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { adminClient } from '@/lib/auth/supabase';
import { publicAccount } from '@/lib/auth/admin';
import { authError, bodyOf, emailSchema } from '@/lib/auth/validation';
import { checkOrigin, json, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
export async function GET(req: Request) {
  try {
    await requireAdmin(req);
    const page = z.coerce.number().int().min(1).max(10000).parse(new URL(req.url).searchParams.get('page') || 1);
    const { data, error } = await adminClient().auth.admin.listUsers({ page, perPage: 50 });
    if (error) throw new PublicError('Impossible de charger les comptes.', 503);
    return json({ users: data.users.filter(u => u.app_metadata.cvats === true).map(publicAccount), hasMore: data.users.length === 50 });
  } catch (error) { return authError(error); }
}
export async function POST(req: Request) {
  try {
    checkOrigin(req);
    await requireAdmin(req);
    const { email } = z.object({ email: emailSchema }).strict().parse(await bodyOf(req));
    const password = 'Cv!' + randomBytes(18).toString('base64url');
    const { data, error } = await adminClient().auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { cvats: true, cvats_role: 'member', enabled: true, must_change_password: true, access_version: randomUUID() } });
    if (error || !data.user) throw new PublicError('Le compte n’a pas pu être créé. Vérifie notamment si cette adresse existe déjà.');
    return json({ user: publicAccount(data.user), temporaryPassword: password }, 201);
  } catch (error) { return authError(error); }
}
