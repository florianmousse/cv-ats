import { pageUser } from '@/lib/auth/pages';
import PrivateHeader from '@/components/private-header';
import {SITE_VERSION} from '@/lib/version';
import AdminPanel from './panel';
export const dynamic = 'force-dynamic';
export default async function Admin() {
  const user = await pageUser(true);
  return <><PrivateHeader user={user} current="admin"/><main className="admin-page"><p className="eyebrow">ADMINISTRATION · v{SITE_VERSION}</p><h1>Les personnes autorisées.</h1><p className="intro-description">Tu décides qui peut accéder à l’atelier et lancer des analyses Gemini.</p><AdminPanel/></main></>;
}
