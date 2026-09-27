import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const reset = process.argv.includes('--reset');
if (!url?.startsWith('https://') || !key || !email?.includes('@') || !password || password.length < 12 || password.length > 128) {
  console.error('Renseigne SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL et ADMIN_PASSWORD (12 à 128 caractères) dans .env.local.');
  process.exit(1);
}
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
try {
  const metadata = { cvats: true, cvats_role: 'admin', enabled: true, must_change_password: true, access_version: randomUUID() };
  if (reset) {
    let target;
    for (let page = 1; page <= 1000; page++) {
      const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw new Error('Recherche du compte impossible.');
      target = data.users.find(user => user.email?.toLowerCase() === email);
      if (target || data.users.length < 100) break;
    }
    if (!target || target.app_metadata.cvats !== true || target.app_metadata.cvats_role !== 'admin') throw new Error('Aucun administrateur CV-ATS ne correspond à cette adresse.');
    const { error } = await client.auth.admin.updateUserById(target.id, { password, email_confirm: true, ban_duration: 'none', app_metadata: metadata });
    if (error) throw new Error('Réinitialisation refusée par Supabase. Vérifie les exigences du mot de passe et les clés.');
  } else {
    const { error } = await client.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: metadata });
    if (error) throw new Error('Création refusée. Vérifie les clés, le mot de passe et si le compte existe déjà. Pour récupérer un administrateur existant : npm run admin:reset.');
  }
  console.log(reset ? 'Administrateur réinitialisé. Les anciennes sessions sont révoquées.' : 'Administrateur créé.');
  console.log('Connecte-toi, puis change le mot de passe temporaire. Retire ensuite ADMIN_PASSWORD de .env.local. Aucun e-mail n’a été envoyé.');
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Opération impossible.');
  process.exitCode = 1;
}
