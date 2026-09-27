import { authClient } from './supabase';
import { PublicError } from '@/lib/http';

export type SiteUser = { id: string; email: string; role: 'admin' | 'member'; mustChangePassword: boolean };
export const SESSION_SECONDS = 3600;
export function cookieName() { return process.env.NODE_ENV === 'production' ? '__Host-cvats-session' : 'cvats-session'; }
export function sessionCookie(token: string, maxAge = SESSION_SECONDS) {
  return `${cookieName()}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.min(maxAge, SESSION_SECONDS))}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
}
export function tokenFromRequest(req: Request) {
  const name = cookieName();
  const part = req.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  try { return part ? decodeURIComponent(part.slice(name.length + 1)) : ''; } catch { return ''; }
}

/** getUser verifies the JWT with Supabase AND retrieves current server-owned rights. */
export async function userFromToken(token: string, allowPasswordChange = false): Promise<SiteUser> {
  if (!token || token.length > 16000) throw new PublicError('Connecte-toi pour accéder au site.', 401);
  const { data, error } = await authClient().auth.getUser(token);
  if (error || !data.user) {
    if (error && (error.status === undefined || error.status >= 500)) throw new PublicError('Le service de connexion est indisponible. Réessaie.', 503);
    throw new PublicError('Ta session a expiré. Reconnecte-toi.', 401);
  }
  const user = data.user;
  const metadata = user.app_metadata;
  if (metadata.cvats !== true || metadata.enabled !== true || !['admin', 'member'].includes(metadata.cvats_role)) {
    throw new PublicError('Ce compte n’est pas autorisé à utiliser le site.', 403);
  }
  // JWT signature was verified above. Comparing the issued version with live
  // metadata revokes old access tokens after disable/reset/logout/password change.
  let issued: Record<string, unknown>;
  try { issued = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')).app_metadata ?? {}; }
  catch { throw new PublicError('Session invalide. Reconnecte-toi.', 401); }
  if (typeof metadata.access_version !== 'string' || !metadata.access_version || issued.access_version !== metadata.access_version) {
    throw new PublicError('Cet accès a été révoqué. Reconnecte-toi.', 401);
  }
  if (!allowPasswordChange && metadata.must_change_password === true) throw new PublicError('Change ton mot de passe avant d’utiliser le site.', 428);
  return { id: user.id, email: user.email ?? '', role: metadata.cvats_role, mustChangePassword: metadata.must_change_password === true };
}
export async function requireUser(req: Request, allowPasswordChange = false) {
  return userFromToken(tokenFromRequest(req), allowPasswordChange);
}
export async function requireAdmin(req: Request) {
  const user = await requireUser(req);
  if (user.role !== 'admin') throw new PublicError('Cet espace est réservé à l’administrateur.', 403);
  return user;
}
