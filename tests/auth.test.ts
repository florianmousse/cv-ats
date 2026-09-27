import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST as analyze } from '../app/api/analyze/route';
import { POST as importCV } from '../app/api/import/route';
import { GET as listUsers, POST as createUser } from '../app/api/admin/users/route';
import { PATCH as editUser, DELETE as deleteUser } from '../app/api/admin/users/[id]/route';
import { POST as login } from '../app/api/auth/login/route';
import { POST as logout } from '../app/api/auth/logout/route';
import { POST as passwordChange } from '../app/api/auth/password/route';
import { cookieName, sessionCookie } from '../lib/auth/session';

const origin = 'https://cv-ats.example';
const ownerId = '00000000-0000-4000-8000-000000000001';
const memberId = '00000000-0000-4000-8000-000000000002';
function user(role = 'member', extra = {}) {
  return { id: role === 'admin' ? ownerId : memberId, email: 'test@example.com', aud: 'authenticated', role: 'authenticated', created_at: '2026-01-01T00:00:00Z', app_metadata: { cvats: true, enabled: true, cvats_role: role, must_change_password: false, access_version: 'version-1', ...extra }, user_metadata: { role: 'admin' } };
}
function token(metadata = user().app_metadata) { return 'header.' + Buffer.from(JSON.stringify({ app_metadata: metadata })).toString('base64url') + '.signature'; }
function request(path: string, method = 'POST', data?: unknown, jwt = '', requestOrigin: string | null = origin) {
  return new Request(origin + path, { method, headers: { ...(requestOrigin ? { Origin: requestOrigin } : {}), ...(jwt ? { Cookie: cookieName() + '=' + jwt } : {}), 'Content-Type': 'application/json' }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
}
async function isolated(fn: () => Promise<void>) {
  const keys = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'GEMINI_API_KEY'];
  const values = keys.map(k => process.env[k]); const realFetch = globalThis.fetch;
  Object.assign(process.env, { SUPABASE_URL: 'https://auth.example.test', SUPABASE_ANON_KEY: 'test-anon', SUPABASE_SERVICE_ROLE_KEY: 'test-service', GEMINI_API_KEY: 'test-gemini' });
  try { await fn(); } finally { globalThis.fetch = realFetch; keys.forEach((key, i) => { if (values[i] === undefined) delete process.env[key]; else process.env[key] = values[i]; }); }
}

test('Anonymous requests cannot invoke Gemini, extract files or manage users', async () => isolated(async () => {
  let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('No external call permitted'); };
  assert.equal((await analyze(request('/api/analyze', 'POST', {}))).status, 401);
  assert.equal((await importCV(request('/api/import', 'POST', {}))).status, 401);
  assert.equal((await listUsers(request('/api/admin/users', 'GET'))).status, 401);
  assert.equal((await createUser(request('/api/admin/users', 'POST', {}))).status, 401);
  assert.equal(calls, 0);
}));

test('A member cannot manage users, even with an admin role in user_metadata', async () => isolated(async () => {
  const current = user(); let privilegedCalls = 0;
  globalThis.fetch = async url => { if (!String(url).endsWith('/auth/v1/user')) privilegedCalls++; return Response.json(current); };
  assert.equal((await listUsers(request('/api/admin/users', 'GET', undefined, token()))).status, 403);
  assert.equal((await createUser(request('/api/admin/users', 'POST', { email: 'new@example.com' }, token()))).status, 403);
  assert.equal((await editUser(request('/api/admin/users/' + memberId, 'PATCH', { action: 'disable' }, token()), { params: Promise.resolve({ id: memberId }) })).status, 403);
  assert.equal(privilegedCalls, 0);
}));

test('Disabled, unapproved, revoked and first-login accounts cannot call Gemini', async () => isolated(async () => {
  for (const [extra, status] of [[{ enabled: false }, 403], [{ cvats: false }, 403], [{ access_version: 'revoked' }, 401], [{ must_change_password: true }, 428]] as const) {
    let geminiCalls = 0;
    globalThis.fetch = async url => { if (!String(url).startsWith('https://auth.example.test')) geminiCalls++; return Response.json(user('member', extra)); };
    const result = await analyze(request('/api/analyze', 'POST', {}, token()));
    assert.equal(result.status, status); assert.equal(geminiCalls, 0);
  }
}));

test('Invalid/expired access tokens and cross-origin requests are refused', async () => isolated(async () => {
  globalThis.fetch = async () => Response.json({ message: 'invalid JWT', code: 'bad_jwt' }, { status: 401 });
  assert.equal((await analyze(request('/api/analyze', 'POST', {}, token()))).status, 401);
  let calls = 0; globalThis.fetch = async () => { calls++; throw new Error('No external call permitted'); };
  for (const supplied of [null, 'https://evil.example']) {
    assert.equal((await login(request('/api/auth/login', 'POST', {}, '', supplied))).status, 403);
    assert.equal((await createUser(request('/api/admin/users', 'POST', {}, token(), supplied))).status, 403);
  }
  assert.equal(calls, 0);
}));

test('Admin creation always provisions a member with a forced password change', async () => isolated(async () => {
  const admin = user('admin'); let creation: Record<string, unknown> = {};
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/auth/v1/user')) return Response.json(admin);
    assert.ok(String(url).endsWith('/auth/v1/admin/users'));
    assert.equal(new Headers(init?.headers).get('apikey'), 'test-service');
    creation = JSON.parse(init?.body as string);
    return Response.json({ ...user(), email: creation.email, app_metadata: creation.app_metadata });
  };
  const result = await createUser(request('/api/admin/users', 'POST', { email: 'new@example.com' }, token(admin.app_metadata)));
  assert.equal(result.status, 201);
  const data = await result.json();
  assert.ok(data.temporaryPassword.length >= 24);
  assert.equal(data.user.role, 'member'); assert.equal(data.user.mustChangePassword, true);
  assert.equal(creation.email_confirm, true);
  assert.equal((await createUser(request('/api/admin/users', 'POST', { email: 'new@example.com', role: 'admin' }, token(admin.app_metadata)))).status, 400);
}));

test('Disable, reset and protected-admin operations enforce their invariants', async () => isolated(async () => {
  const admin = user('admin'); let mutation: Record<string, unknown> = {}; let target = user();
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/auth/v1/user')) return Response.json(admin);
    if (init?.method === 'PUT') { mutation = JSON.parse(init.body as string); return Response.json({ ...target, app_metadata: mutation.app_metadata }); }
    return Response.json(target);
  };
  const ctx = { params: Promise.resolve({ id: memberId }) };
  const disabled = await editUser(request('/api/admin/users/' + memberId, 'PATCH', { action: 'disable' }, token(admin.app_metadata)), ctx);
  assert.equal(disabled.status, 200);
  assert.equal(mutation.ban_duration, '876000h');
  assert.equal((mutation.app_metadata as Record<string, unknown>).enabled, false);
  assert.notEqual((mutation.app_metadata as Record<string, unknown>).access_version, 'version-1');
  const reset = await editUser(request('/api/admin/users/' + memberId, 'PATCH', { action: 'reset' }, token(admin.app_metadata)), ctx);
  assert.equal(reset.status, 200); assert.ok((await reset.json()).temporaryPassword);
  assert.equal((mutation.app_metadata as Record<string, unknown>).must_change_password, true);
  target = admin;
  assert.equal((await deleteUser(request('/api/admin/users/' + ownerId, 'DELETE', undefined, token(admin.app_metadata)), { params: Promise.resolve({ id: ownerId }) })).status, 403);
}));

test('Login sets an HttpOnly cookie and never returns tokens to the browser JSON', async () => isolated(async () => {
  const current = user('member', { must_change_password: true }); const access = token(current.app_metadata);
  globalThis.fetch = async url => String(url).includes('/token') ? Response.json({ access_token: access, refresh_token: 'never-exposed', expires_in: 3600, token_type: 'bearer', user: current }) : Response.json(current);
  const result = await login(request('/api/auth/login', 'POST', { email: current.email, password: 'temporary-password' }));
  assert.equal(result.status, 200);
  const cookie = result.headers.get('set-cookie') ?? '';
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Max-Age=3600/);
  assert.deepEqual(await result.json(), { redirect: '/compte' });
  const production = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: 'production' });
  try { assert.match(sessionCookie('abc'), /^__Host-cvats-session=/); assert.match(sessionCookie('abc'), /; Secure/); }
  finally { if (production === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV; else Object.assign(process.env, { NODE_ENV: production }); }
}));

test('Logout revokes sessions; password changes require the existing password', async () => isolated(async () => {
  const current = user(); let updated: Record<string, unknown> = {};
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('/token')) return Response.json({ message: 'Wrong password' }, { status: 400 });
    if (init?.method === 'PUT') { updated = JSON.parse(init.body as string); return Response.json(current); }
    return Response.json(current);
  };
  const rejected = await passwordChange(request('/api/auth/password', 'POST', { currentPassword: 'wrong-password', password: 'new-long-password' }, token()));
  assert.equal(rejected.status, 400); assert.deepEqual(updated, {});
  const result = await logout(request('/api/auth/logout', 'POST', undefined, token()));
  assert.equal(result.status, 200); assert.match(result.headers.get('set-cookie') ?? '', /Max-Age=0/);
  assert.notEqual((updated.app_metadata as Record<string, unknown>).access_version, 'version-1');
}));
