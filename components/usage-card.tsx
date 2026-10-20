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
 return <aside className="usage-card" aria-label="Ma consommation IA" aria-busy={loading}><div><strong>Ma consommation IA — aucun plafond CV-ATS</strong>{loading?<span>Actualisation…</span>:error?<span role="alert">{error}</span>:usage&&settings?<>
 <span>{settings.hasPersonalKey?'Clé personnelle utilisée':settings.sharedAvailable?'Clé du site utilisée':'Ajoute une clé dans Mon compte'} · {settings.model}</span>
 <span>{usage.attempted} appels ce mois-ci : {usage.personalCalls} avec ta clé personnelle, {usage.sharedCalls} avec celle du site.</span>
 <small>{usage.tokens.toLocaleString('fr-FR')} tokens déclarés{usage.unknownCalls>0&&` · ${usage.unknownCalls} appels sans total connu`}. Suivi limité aux analyses de ce site, sur le mois UTC.</small>
 </>:null}<small>Seules les limites de ton projet Gemini s’appliquent. Un scan utilise 1 appel ; une optimisation avec vérification, jusqu’à 2.</small><Link href="/compte">Gérer ma clé Gemini →</Link></div><button className="text-button" disabled={loading} onClick={()=>setReload(v=>v+1)}>Actualiser</button></aside>;
}
