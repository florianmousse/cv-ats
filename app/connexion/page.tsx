import { authConfigured } from '@/lib/auth/supabase';
import LoginForm from './form';
export const dynamic = 'force-dynamic';
export default async function Login({ searchParams }: { searchParams: Promise<{ changed?: string; configuration?: string }> }) {
  const params = await searchParams;
  return <div className="auth-screen"><a className="brand" href="/connexion">CV-ATS</a><main className="auth-card"><p className="eyebrow">ACCÈS PRIVÉ</p><h1>Bienvenue dans ton atelier.</h1><p>Connecte-toi avec le compte créé par l&apos;administrateur.</p>
    {params.changed === '1' && <div className="message success" role="status">Mot de passe modifié. Connecte-toi avec le nouveau mot de passe.</div>}
    {!authConfigured() ? <div className="message error" role="alert">L&apos;accès privé n&apos;est pas encore configuré. Le propriétaire doit suivre le guide Supabase et Vercel fourni avec le projet.</div> : <LoginForm/>}
    <div className="auth-footnote">Pas encore d&apos;accès ou mot de passe oublié ? Contacte l&apos;administrateur. Il n&apos;y a pas d&apos;inscription publique.</div>
  </main></div>;
}
