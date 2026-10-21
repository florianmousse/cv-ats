import {pageUser} from '@/lib/auth/pages';
import PrivateHeader from '@/components/private-header';
import PasswordForm from './form';
import AccountSettings from './settings';
export const dynamic='force-dynamic';
export default async function Account(){
 const user=await pageUser(false,true);
 return <><PrivateHeader user={user} current="compte"/>{user.mustChangePassword?<main className="account-page"><section className="auth-card"><p className="eyebrow">PREMIÈRE CONNEXION</p><h1>Sécurise ton compte.</h1><p className="account-email">{user.email}</p><p>Remplace ton mot de passe temporaire pour accéder à l’atelier.</p><PasswordForm/></section></main>:<AccountSettings user={user}/>}</>;
}
