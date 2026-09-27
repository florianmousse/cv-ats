'use client';
import {useEffect,useState} from 'react';
import type {UserUsage} from '@/lib/data/usage';
export default function UsageCard({revision}:{revision:number}){
 const [usage,setUsage]=useState<UserUsage|null>(null),[error,setError]=useState(''),[reload,setReload]=useState(0),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();async function load(){setLoading(true);setError('');try{
  const r=await fetch('/api/usage',{cache:'no-store',signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);setUsage(body.usage);
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Quota indisponible.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[revision,reload]);
 return <aside className="usage-card" aria-label="Mon quota IA" aria-busy={loading}><div><strong>Mon quota IA</strong>{loading?<span>Actualisation…</span>:error?<span role="alert">{error}</span>:usage?<>
 <span><b>{Math.max(0,usage.limit-usage.used)}</b> appels disponibles sur {usage.limit} ce mois-ci</span><progress aria-label="Appels utilisés ce mois-ci" max={Math.max(1,usage.limit)} value={Math.min(usage.used,Math.max(1,usage.limit))}/>
 <small>{usage.used} utilisés ou réservés · remise à zéro le {new Date(usage.resetAt).toLocaleString('fr-FR')} (1er du mois à 00 h UTC).</small>
 </>:null}<small>Scan : 1 appel. Optimisation avec vérification : jusqu’à 2. Un appel tenté peut être décompté même en cas d’erreur.</small></div><button className="text-button" disabled={loading} onClick={()=>setReload(v=>v+1)}>Actualiser</button></aside>;
}
