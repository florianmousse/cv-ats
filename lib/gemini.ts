import { parseModelJSON } from './cv';
import { PublicError } from './http';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

/** A stateless text request: no Files API, explicit cache, or conversation history. */
export async function askGemini(
  system: string,
  data: unknown,
  signal: AbortSignal,
  settings: { apiKey: string; model: string },
  fetcher: typeof fetch = fetch,
): Promise<unknown> {
  if (!/^gemini-[a-zA-Z0-9.-]+$/.test(settings.model)) {
    throw new PublicError('Le modèle Gemini configuré est invalide. Vérifie GEMINI_MODEL.', 503);
  }
  const response = await fetcher(
    `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent`,
    {
      method: 'POST',
      signal,
      headers: { 'x-goog-api-key': settings.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: JSON.stringify(data) }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 12000 },
      }),
      cache: 'no-store',
    },
  );
  if (!response.ok) {
    // Never echo the upstream error: it may contain request content or metadata.
    if (response.status === 429) throw new PublicError('Le quota Gemini est atteint ou le service est trop sollicité. Attends un peu puis réessaie. Vérifie aussi les limites de ton projet Google AI Studio.', 429);
    if (response.status === 400 || response.status === 401 || response.status === 403) throw new PublicError('Gemini a refusé la requête. Vérifie la clé API, ses autorisations, le modèle et l’accès au service dans Google AI Studio.', 502);
    if (response.status === 404) throw new PublicError('Ce modèle Gemini n’est pas disponible pour ce projet. Modifie GEMINI_MODEL avec un modèle accessible depuis Google AI Studio.', 502);
    throw new PublicError('Gemini est temporairement indisponible. Réessaie plus tard.', 502);
  }
  const result = await response.json() as {
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
    promptFeedback?: { blockReason?: string };
  };
  if (result.promptFeedback?.blockReason) throw new PublicError('Gemini n’a pas pu analyser ce contenu. Retire les informations inutiles à la candidature puis réessaie.', 422);
  const candidate = result.candidates?.[0];
  if (candidate?.finishReason !== 'STOP') throw new PublicError('La réponse Gemini est incomplète ou a été interrompue. Raccourcis le CV ou réessaie.', 502);
  const raw = candidate.content?.parts?.filter(part => !part.thought).map(part => part.text ?? '').join('') ?? '';
  return parseModelJSON(raw);
}
