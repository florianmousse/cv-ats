import { createClient } from '@supabase/supabase-js';
import { PublicError } from '@/lib/http';

/** Server-only clients. Never import this module in a client component. */
export function authConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
function settings() {
  if (!authConfigured()) throw new PublicError('L’accès privé n’est pas encore configuré. Consulte le guide de déploiement.', 503);
  const url = process.env.SUPABASE_URL!;
  if (!url.startsWith('https://')) throw new PublicError('L’URL Supabase doit utiliser HTTPS.', 503);
  return { url, anon: process.env.SUPABASE_ANON_KEY!, admin: process.env.SUPABASE_SERVICE_ROLE_KEY! };
}
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(15000) }) },
};
export function authClient() { const s = settings(); return createClient(s.url, s.anon, options); }
export function adminClient() { const s = settings(); return createClient(s.url, s.admin, options); }
