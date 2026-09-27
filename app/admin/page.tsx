import { pageUser } from '@/lib/auth/pages';
import PrivateHeader from '@/components/private-header';
import AdminPanel from './panel';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const user = await pageUser(true);
  return <><PrivateHeader user={user}/><main className="admin-page"><p className="eyebrow">ADMINISTRATION</p><h1>Les personnes autorisées.</h1><p className="intro-description">Tu décides qui peut accéder à l’atelier et utiliser ton API Gemini.</p><AdminPanel/></main></>;
}
