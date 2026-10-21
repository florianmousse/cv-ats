'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import type {UserUsage} from '@/lib/data/usage';
import type {KeyStatus} from '@/lib/keys/personal';
export default function UsageCard({revision}:{revision:number}){
 const [usage,setUsage]=useState<UserUsage|null>(null),[settings,setSettings]=useState<KeyStatus|null>(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();async function load(){setLoading(true);setError('');try{
  const r=await fetch('/api/usage',{cache:'no-store',signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);setUsage(body.usage);setSettings(body.settings);
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Suivi indisponible.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[revision,reload]);
 const remaining=usage?.quota?Math.max(0,Math.min(usage.quota.limit-usage.quota.used,usage.quota.dailyLimit-usage.quota.dailyUsed)):0;
 return <aside className={'usage-card '+(settings?.hasPersonalKey?'personal-active':'shared-active')} aria-label="Ma consommation IA" aria-busy={loading}><div><strong>{settings?.hasPersonalKey?'Ta clé, tes analyses':settings&&!settings.sharedAvailable?'Configure ton accès à l’IA':'Un coup de pouce pour démarrer'}</strong>{loading?<span>Actualisation…</span>:error?<span role="alert">{error}</span>:usage&&settings?<>
 <span>{settings.hasPersonalKey?'Clé personnelle utilisée':settings.sharedAvailable?'Clé du site utilisée':'Ajoute une clé dans Mon compte'} · {settings.model}</span>
 {!settings.hasPersonalKey&&settings.sharedAvailable&&usage.quota&&<><span className="quota-remaining"><b>{remaining}</b> appels disponibles sur la clé du site</span><progress aria-label="Quota mensuel de la clé du site utilisé" value={Math.min(usage.quota.used,usage.quota.limit)} max={Math.max(1,usage.quota.limit)}/><span>{usage.quota.used} / {usage.quota.limit} utilisés ou réservés ce mois-ci · plafond quotidien partagé : {usage.quota.dailyUsed} / {usage.quota.dailyLimit}.</span><small>Quota mensuel renouvelé le {new Date(usage.quota.resetAt).toLocaleDateString('fr-FR',{timeZone:'UTC'})} à 00:00 UTC. Plafond quotidien renouvelé à minuit UTC.</small>{remaining<2&&<span>{remaining===0?'Quota partagé épuisé. Ajoute ta clé personnelle pour continuer.':'Il reste de quoi faire un scan. Une optimisation nécessite 2 appels disponibles.'}</span>}</>}
 <span>{usage.attempted} appels ce mois-ci : {usage.personalCalls} personnels, {usage.sharedCalls} partagés.</span>
 <small>{usage.tokens.toLocaleString('fr-FR')} tokens déclarés{usage.unknownCalls>0&&` · ${usage.unknownCalls} appels sans total connu`}. Suivi limité aux analyses de ce site, sur le mois UTC.</small>
 </>:null}<small>Scan : 1 appel · Optimisation : jusqu’à 2. Avec ta clé personnelle, aucun quota CV-ATS ; les limites et frais éventuels de Google s’appliquent.</small><Link href="/compte#ia">{settings?.hasPersonalKey?'Gérer ma clé Gemini':'Configurer ma clé personnelle'} →</Link></div><button className="text-button" disabled={loading} onClick={()=>setReload(v=>v+1)}>Actualiser</button></aside>;
}
