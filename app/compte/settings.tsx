'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,KeyRound,ShieldCheck} from 'lucide-react';
import type {SiteUser} from '@/lib/auth/session';
import GeminiForm from './gemini-form';
import PasswordForm from './form';
import UsageCard from '@/components/usage-card';

export default function AccountSettings({user}:{user:SiteUser}){
 const [tab,setTab]=useState<'ia'|'securite'>('ia'),[revision,setRevision]=useState(0);
 useEffect(()=>{const sync=()=>setTab(location.hash==='#securite'?'securite':'ia');sync();window.addEventListener('hashchange',sync);return()=>window.removeEventListener('hashchange',sync);},[]);
 function select(value:'ia'|'securite'){setTab(value);history.replaceState(null,'',`#${value}`);}
 return <main className="settings-page"><Link className="back-link" href="/"><ArrowLeft size={15}/> Retour à l’atelier</Link><div className="settings-heading"><div><p className="eyebrow">MON ESPACE</p><h1>Tout ce qu’il te faut pour avancer.</h1><p>Gère ton accès à l’IA et la sécurité de ton compte.</p></div><div className="identity-chip"><span>{user.email}</span><small>{user.role==='admin'?'Administrateur':'Compte personnel'}</small></div></div>
  <div className="settings-layout"><div className="settings-sidebar"><div className="settings-tabs" role="tablist" aria-label="Réglages du compte" aria-orientation="vertical" onKeyDown={event=>{if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?'ia':event.key==='End'?'securite':tab==='ia'?'securite':'ia';select(next);document.getElementById(`tab-${next}`)?.focus();}}}>
   <button role="tab" id="tab-ia" aria-selected={tab==='ia'} aria-controls="panel-ia" tabIndex={tab==='ia'?0:-1} onClick={()=>select('ia')}><KeyRound size={18}/><span>IA et consommation<small>Clé Gemini et quota du site</small></span></button>
   <button role="tab" id="tab-securite" aria-selected={tab==='securite'} aria-controls="panel-securite" tabIndex={tab==='securite'?0:-1} onClick={()=>select('securite')}><ShieldCheck size={18}/><span>Sécurité<small>Mot de passe et sessions</small></span></button>
  </div><p className="settings-aside-note">Tes clés sont chiffrées. Les CV restent enregistrés uniquement à ta demande.</p></div>
  <div className="settings-content"><section role="tabpanel" id="panel-ia" aria-labelledby="tab-ia" hidden={tab!=='ia'}><GeminiForm onChanged={()=>setRevision(v=>v+1)}/><UsageCard revision={revision}/></section>
  <section role="tabpanel" id="panel-securite" aria-labelledby="tab-securite" hidden={tab!=='securite'} className="security-panel"><div className="settings-card-heading"><span className="settings-icon"><ShieldCheck size={22}/></span><div><h2>Changer de mot de passe</h2><p>Utilise un mot de passe unique pour protéger ton espace.</p></div></div><PasswordForm/><div className="session-note"><ShieldCheck size={16}/><p>Après la modification, toutes tes sessions seront fermées. Tu pourras te reconnecter avec ton nouveau mot de passe.</p></div></section></div></div>
 </main>;
}
