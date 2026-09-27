import Link from 'next/link';
import type { SiteUser } from '@/lib/auth/session';
import AccountNav from './account-nav';
export default function PrivateHeader({ user }: { user: SiteUser }) {
  return <header className="site-header"><div className="header-inner"><Link href="/" className="brand">CV—ATS</Link><Link href="/">L’atelier CV</Link><AccountNav user={user}/></div></header>;
}
