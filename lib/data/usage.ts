import { adminClient } from '@/lib/auth/supabase';
import { PublicError } from '@/lib/http';

export type UserUsage = { userId: string; limit: number; used: number; attempted: number; tokens: number; unknownCalls: number; month: string; resetAt: string };
export type AdminUsage = { dailyLimit: number; dailyUsed: number; day: string; resetAt: string; month: string; models: Array<{ model: string; charged: number; attempted: number; tokens: number; prompt: number|null; output: number|null; thought: number|null; unknown: number; pending: number; failed: number }> };

export function dataError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  const message = error.message ?? '';
  if (message.includes('CVATS_USER_QUOTA')) throw new PublicError('Ton quota mensuel ne permet plus cette action. Un scan nécessite 1 appel, une optimisation 2. Contacte l’administrateur.', 429);
  if (message.includes('CVATS_GLOBAL_QUOTA')) throw new PublicError('Le budget quotidien de CV-ATS est atteint. Réessaie après sa remise à zéro ou contacte l’administrateur.', 429);
  if (message.includes('CVATS_RATE_LIMIT')) throw new PublicError('Trop d’analyses rapprochées. Patiente une minute avant de réessayer.', 429);
  if (message.includes('CVATS_FORBIDDEN')) throw new PublicError('Ce compte n’est pas autorisé à effectuer cette action.', 403);
  if (message.includes('CVATS_SAVE_LIMIT')) throw new PublicError('Tu as atteint les 20 sauvegardes. Supprime une ancienne version pour en ajouter une.', 409);
  if (message.includes('CVATS_NOT_FOUND')) throw new PublicError('Compte introuvable.', 404);
  throw new PublicError('Le service de sauvegardes et quotas est indisponible. Vérifie notamment que la migration SQL a été exécutée dans Supabase.', 503);
}
export async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await adminClient().rpc(name, args);
  dataError(error);
  return data as T;
}
export function userUsage(ids: string[]) { return rpc<UserUsage[]>('cvats_user_usage', { p_users: ids }); }
export function adminUsage() { return rpc<AdminUsage>('cvats_admin_usage'); }
export function reserve(user: string, mode: 'scan' | 'optimize', model: string) {
  return rpc<string>('cvats_reserve', { p_user: user, p_mode: mode, p_model: model });
}
export function finish(run: string, success: boolean) { return rpc('cvats_finish', { p_run: run, p_success: success }); }

function tokenCount(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}
/** Observe every provider request, including the fidelity audit and failed replies.
 * Start is persisted BEFORE fetch; failed/unknown requests remain charged.
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
