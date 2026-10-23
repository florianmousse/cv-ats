import { adminClient } from '@/lib/auth/supabase';
import { PublicError } from '@/lib/http';

export type SharedQuota = {limit:number;override:number|null;defaultLimit:number;used:number;dailyLimit:number;dailyUsed:number;resetAt:string;dailyResetAt:string};
export type UserUsage = { quota:SharedQuota; userId: string; attempted: number; tokens: number; unknownCalls: number; month: string; sharedCalls:number; personalCalls:number; sharedTokens:number; personalTokens:number; pending:number; hasPersonalKey:boolean };
export type AdminUsage = { quota:SharedQuota; month: string; models: Array<{ model: string; source:'shared'|'personal'; attempted: number; tokens: number; prompt: number|null; output: number|null; thought: number|null; unknown: number; pending: number; failed: number }> };

export function dataError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  const message = error.message ?? '';
  if (message.includes('CVATS_USER_QUOTA')) throw new PublicError('Ton quota mensuel pour la clé du site ne permet plus cette analyse. Ajoute ta clé Gemini dans Mon compte pour continuer, ou attends le renouvellement du quota.', 429);
  if (message.includes('CVATS_GLOBAL_QUOTA')) throw new PublicError('Le quota quotidien de la clé du site ne permet plus cette analyse. Ajoute ta clé Gemini dans Mon compte pour continuer, ou réessaie après minuit UTC.', 429);
  if (message.includes('CVATS_FORBIDDEN')) throw new PublicError('Ce compte n’est pas autorisé à effectuer cette action.', 403);
  if (message.includes('CVATS_SAVE_LIMIT')) throw new PublicError('Tu as atteint les 20 sauvegardes. Supprime une ancienne version pour en ajouter une.', 409);
  if (message.includes('CVATS_NOT_FOUND')) throw new PublicError('Compte introuvable.', 404);
  if(message.includes('CVATS_INVALID'))throw new PublicError('Cette opération n’est pas disponible. Vérifie que la migration SQL 004 a été appliquée pour les lettres et la structuration du CV.',503);
  throw new PublicError('Le service de sauvegardes et de suivi est indisponible. Vérifie notamment que les migrations SQL 001 à 004 ont été exécutées dans Supabase.', 503);
}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await adminClient().rpc(name, args);
  dataError(error);
  return data as T;
}
function requireQuota(value: {quota?:SharedQuota}) {
  if (!value.quota) throw new PublicError('Les quotas IA ne sont pas configurés. Applique la migration SQL 003 dans Supabase.',503);
}
export async function userUsage(ids: string[]) {
  const users=await rpc<UserUsage[]>('cvats_user_usage', { p_users: ids });
  users.forEach(requireQuota);return users;
}
export async function adminUsage() {
  const usage=await rpc<AdminUsage>('cvats_admin_usage');requireQuota(usage);return usage;
}
export function beginRun(user: string, mode: 'scan' | 'optimize' | 'structure' | 'letter', model: string, source:'personal'|'shared') {
  return rpc<string>('cvats_admit_run', { p_user: user, p_mode: mode, p_model: model, p_source:source });
}
export function finish(run: string, success: boolean) { return rpc('cvats_finish', { p_run: run, p_success: success }); }

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
/** Observe every provider request, including the fidelity audit and failed replies.
 * Start is persisted BEFORE fetch; failed/unknown requests remain visible.
 * No prompt, CV, result, key or raw provider error is persisted. */
export function meteredFetch(run: string, fetcher: typeof fetch = fetch): typeof fetch {
  return async (input, init) => {
    const ordinal = await rpc<number>('cvats_start_call', { p_run: run });
    let response: Response;
    try { response = await fetcher(input, init); }
    catch (error) {
      await rpc('cvats_record_call', { p_run: run, p_ordinal: ordinal, p_status: null, p_prompt: null, p_output: null, p_thought: null, p_total: null });
      throw error;
    }
    let usage: Record<string, unknown> = {};
    try {
      const body = await response.clone().json();
      if (body.usageMetadata && typeof body.usageMetadata === 'object') usage = body.usageMetadata;
    } catch { /* Provider non-JSON response: counts explicitly remain unknown. */ }
    await rpc('cvats_record_call', {
      p_run: run, p_ordinal: ordinal, p_status: response.status,
      p_prompt: tokenCount(usage.promptTokenCount), p_output: tokenCount(usage.candidatesTokenCount),
      p_thought: tokenCount(usage.thoughtsTokenCount), p_total: tokenCount(usage.totalTokenCount),
    });
    return response;
  };
}
