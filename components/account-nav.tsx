'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronDown,KeyRound,LogOut,Settings2,ShieldCheck,UserRound} from 'lucide-react';
import type {SiteUser} from '@/lib/auth/session';

export default function AccountNav({user,current}:{user:SiteUser;current?:'atelier'|'compte'|'admin'}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const menu=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(event:PointerEvent)=>{if(menu.current&&!menu.current.contains(event.target as Node))menu.current.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 async function logout(){setBusy(true);setError('');try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error('La déconnexion a échoué. Réessaie.');window.location.replace('/connexion');}catch(e){setError(e instanceof Error?e.message:'Réessaie.');setBusy(false);}}
 return <details className="profile-menu" ref={menu} onKeyDown={event=>{if(event.key==='Escape'&&menu.current){menu.current.open=false;menu.current.querySelector('summary')?.focus();}}}>
  <summary aria-label="Mon espace" className={current==='compte'?'is-current':''}><span className="profile-avatar"><UserRound size={17}/></span><span>Mon espace</span><ChevronDown size={14}/></summary>
  <div className="profile-popover"><div className="profile-identity"><strong>Ton espace personnel</strong><span>{user.email}</span></div>
   <a onClick={()=>{if(menu.current)menu.current.open=false;}} href="/compte#ia" aria-current={current==='compte'?'page':undefined}><KeyRound size={16}/><span>IA et consommation</span></a>
   <a onClick={()=>{if(menu.current)menu.current.open=false;}} href="/compte#securite"><Settings2 size={16}/><span>Sécurité du compte</span></a>
   {user.role==='admin'&&!user.mustChangePassword&&<a href="/admin" aria-current={current==='admin'?'page':undefined}><ShieldCheck size={16}/><span>Administration</span></a>}
   <button disabled={busy} onClick={logout}><LogOut size={16}/>{busy?'Déconnexion…':'Se déconnecter'}</button>
   {error&&<p role="alert">{error}</p>}
  </div>
 </details>;
}
