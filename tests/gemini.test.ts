import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askGemini } from '../lib/gemini';
import { parseModelJSON, cvSchema, labels, toPlainText, assertGroundedFields } from '../lib/cv';
import { POST } from '../app/api/analyze/route';

const fixture = {
  nom: 'Élodie Exemple', titre: 'Développeuse web',
  contact: { ville: 'Rennes', telephone: '', email: 'exemple@example.com', portfolio: '' },
  profil: 'Développeuse web React.',
  experiences: [{ poste: 'Développeuse web', entreprise: 'Entreprise Exemple', dates: '2022 – 2025', puces: ['Maintenir 3 applications React.'] }],
  competences: ['React'], formation: [],
};
const settings = { apiKey: 'test-only-key', model: 'gemini-3.5-flash-lite' };
const signal = new AbortController().signal;
const success = (value: unknown) => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(value) }] } }] });

// Every provider response in this file is mocked. No external request or real key.
test('Gemini uses a server header and JSON output, without a key in its URL', async () => {
  let calls = 0;
  const mock = (async (url, options) => {
    calls++;
    assert.ok(String(url).endsWith('/gemini-3.5-flash-lite:generateContent'));
    assert.ok(!String(url).includes(settings.apiKey));
    const headers = new Headers(options?.headers);
    assert.equal(headers.get('x-goog-api-key'), settings.apiKey);
    const body = JSON.parse(options?.body as string);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.equal(body.systemInstruction.parts[0].text, 'Consignes');
    assert.equal(options?.cache, 'no-store');
    return success({ valide: true });
  }) as typeof fetch;
  assert.deepEqual(await askGemini('Consignes', { cv: 'exemple' }, signal, settings, mock), { valide: true });
  assert.equal(calls, 1);
});

test('Quota, blocked, empty and incomplete responses fail safely', async () => {
  await assert.rejects(askGemini('', {}, signal, settings, async () => new Response('', { status: 429 })), /quota Gemini/);
  await assert.rejects(askGemini('', {}, signal, settings, async () => new Response('', { status: 404 })), /modèle Gemini/);
  await assert.rejects(askGemini('', {}, signal, settings, async () => Response.json({ promptFeedback: { blockReason: 'SAFETY' } })), /contenu/);
  await assert.rejects(askGemini('', {}, signal, settings, async () => Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] })), /incomplète/);
  await assert.rejects(askGemini('', {}, signal, settings, async () => Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [] } }] })), /illisible/);
});

test('CV validation tolerates surrounding prose but rejects invented facts', () => {
  const cv = cvSchema.parse(parseModelJSON(`Voici :\n\`\`\`json\n${JSON.stringify(fixture)}\n\`\`\``));
  const source = toPlainText(cv);
  assertGroundedFields(cv, source);
  assert.throws(() => assertGroundedFields({ ...cv, nom: 'Une autre personne' }, source));
  assert.throws(() => assertGroundedFields({ ...cv, profil: 'Progression de 77 %' }, source));
  assert.throws(() => assertGroundedFields({ ...cv, experiences: [{ ...cv.experiences[0], dates: '2015 – 2026' }] }, source));
});

test('Analysis route: missing key, scan without job, optimization and rejected audit', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const realFetch = globalThis.fetch;
  const request = (mode: string, job = '') => new Request('https://cv-ats.example/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, cv: toPlainText(fixture), job }) });
  try {
    delete process.env.GEMINI_API_KEY;
    const unavailable = await POST(request('scan'));
    assert.equal(unavailable.status, 503);
    assert.match(unavailable.headers.get('cache-control') ?? '', /no-store/);
    process.env.GEMINI_API_KEY = settings.apiKey;
    process.env.GEMINI_MODEL = settings.model;
    globalThis.fetch = async () => success({ score: 75, pointsForts: ['Texte lisible'], problemes: [], motsClesManquants: ['Python'], recommandations: [] });
    const scan = await POST(request('scan'));
    assert.equal(scan.status, 200);
    assert.deepEqual((await scan.json()).data.motsClesManquants, []);
    let count = 0;
    globalThis.fetch = async () => success(++count === 1 ? fixture : { fidele: true, titres: labels });
    const result = await POST(request('optimize', 'Poste de développeuse web React : maintenance des applications.'));
    assert.equal(result.status, 200);
    assert.equal(count, 2);
    assert.deepEqual((await result.json()).data, fixture);
    count = 0;
    globalThis.fetch = async () => success(++count === 1 ? fixture : { fidele: false, titres: labels });
    assert.equal((await POST(request('optimize', 'Poste de développeuse web React : maintenance des applications.'))).status, 422);
  } finally {
    globalThis.fetch = realFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = previousModel;
  }
});
