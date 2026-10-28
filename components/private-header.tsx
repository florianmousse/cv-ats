import Link from 'next/link';
import {FileText} from 'lucide-react';
import type {SiteUser} from '@/lib/auth/session';
import AccountNav from './account-nav';
export default function PrivateHeader({user,current='atelier'}:{user:SiteUser;current?:'atelier'|'compte'|'admin'}){
 return <header className="site-header clean-header"><div className="header-inner"><Link href="/" className="brand" aria-label="CV-ATS, accueil"><span className="brand-icon"><FileText size={21}/></span>CV<span className="brand-dash">-</span>ATS</Link>{!user.mustChangePassword&&<nav className="main-nav" aria-label="Navigation principale"><Link href="/" aria-current={current==='atelier'?'page':undefined}>Ma candidature</Link>{current==='admin'&&<span className="current-location">Administration</span>}</nav>}<AccountNav user={user} current={current}/></div></header>;
}
