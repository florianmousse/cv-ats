import { pageUser } from '@/lib/auth/pages';
import PrivateHeader from '@/components/private-header';
import PasswordForm from './form';
export const dynamic = 'force-dynamic';
export default async function Account() {
  const user = await pageUser(false, true);
  return <><PrivateHeader user={user}/><main className="account-page"><section className="auth-card"><p className="eyebrow">MON COMPTE</p><h1>{user.mustChangePassword ? 'Choisis ton mot de passe.' : 'Changer de mot de passe'}</h1><p className="account-email">{user.email}</p><p>{user.mustChangePassword ? 'Remplace le mot de passe temporaire avant d’accéder à l’atelier.' : 'Toutes tes sessions seront fermées après le changement.'}</p><PasswordForm/></section></main></>;
}
