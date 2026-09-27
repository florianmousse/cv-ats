import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth/session';
import { adminClient } from '@/lib/auth/supabase';
import { publicAccount } from '@/lib/auth/admin';
import { authError, bodyOf } from '@/lib/auth/validation';
import { checkOrigin, json, PublicError } from '@/lib/http';
export const runtime = 'nodejs';
type Context = { params: Promise<{ id: string }> };
async function target(req: Request, ctx: Context) {
  checkOrigin(req);
  const actor = await requireAdmin(req);
  const { id } = await ctx.params;
  z.string().uuid().parse(id);
  const client = adminClient();
  const { data, error } = await client.auth.admin.getUserById(id);
  if (error || !data.user || data.user.app_metadata.cvats !== true) throw new PublicError('Compte introuvable.', 404);
  if (actor.id === id || data.user.app_metadata.cvats_role === 'admin') throw new PublicError('Les comptes administrateurs sont protégés contre cette modification.', 403);
  return { client, id, user: data.user };
}
export async function PATCH(req: Request, ctx: Context) {
  try {
    const { client, id, user } = await target(req, ctx);
    const { action } = z.object({ action: z.enum(['enable', 'disable', 'reset']) }).strict().parse(await bodyOf(req));
    const password = action === 'reset' ? 'Cv!' + randomBytes(18).toString('base64url') : undefined;
    const { data, error } = await client.auth.admin.updateUserById(id, {
      ...(password ? { password } : { ban_duration: action === 'disable' ? '876000h' : 'none' }),
      app_metadata: {
        ...user.app_metadata,
        access_version: randomUUID(),
        ...(password ? { must_change_password: true } : { enabled: action === 'enable' }),
      },
    });
    if (error || !data.user) throw new PublicError('La modification du compte a échoué.', 503);
    return json({ user: publicAccount(data.user), ...(password ? { temporaryPassword: password } : {}) });
  } catch (error) { return authError(error); }
}
export async function DELETE(req: Request, ctx: Context) {
  try {
    const { client, id } = await target(req, ctx);
    const { error } = await client.auth.admin.deleteUser(id);
    if (error) throw new PublicError('Le compte n’a pas pu être supprimé.', 503);
    return json({ ok: true });
  } catch (error) { return authError(error); }
}
