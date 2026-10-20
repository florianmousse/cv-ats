'use client';
import {useEffect,useState} from 'react';
import type {AdminUsage,UserUsage} from '@/lib/data/usage';
import QuotaEditor from '@/components/quota-editor';
const number=(n:number|null)=>n===null?'non renseigné':n.toLocaleString('fr-FR');
export function UsageDashboard({onPolicySaved}:{onPolicySaved:()=>void}){
 const [usage,setUsage]=useState<AdminUsage|null>(null),[revision,setRevision]=useState(0),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();async function load(){setLoading(true);try{
  const r=await fetch('/api/admin/usage',{cache:'no-store',signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);setUsage(body.usage);
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Suivi indisponible.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[revision]);
 const totals=(source:'shared'|'personal')=>usage?.models.filter(m=>m.source===source).reduce((acc,m)=>({calls:acc.calls+m.attempted,tokens:acc.tokens+m.tokens}),{calls:0,tokens:0})??{calls:0,tokens:0};
 return <section className="usage-dashboard" aria-busy={loading}><div className="panel-heading"><div><p className="eyebrow">BUDGET IA</p><h2>Garder la maîtrise de la clé du site</h2><p>Offre quelques analyses pour démarrer, puis invite chacun à utiliser sa clé personnelle. Les plafonds ci-dessous concernent uniquement la clé partagée, administrateurs compris.</p></div><button className="secondary-button small" disabled={loading} onClick={()=>{setError('');setRevision(v=>v+1);}}>Actualiser</button></div>
 {!loading&&usage?.quota&&<div className="quota-settings"><QuotaEditor quota={usage.quota} key={`${usage.quota.dailyLimit}-${usage.quota.defaultLimit}`} onSaved={()=>{setRevision(v=>v+1);onPolicySaved();}}/><p><strong>{number(usage.quota.dailyUsed)} / {number(usage.quota.dailyLimit)}</strong> appels utilisés ou réservés aujourd’hui. Renouvellement à minuit UTC. Les quotas mensuels repartent le 1er du mois à 00:00 UTC.</p><p>Une modification conserve la consommation existante et s’applique aux prochaines analyses. Les exceptions par compte se règlent ci-dessous.</p></div>}
 <p><a href="https://aistudio.google.com/usage" target="_blank" rel="noreferrer">Consommation officielle de mon projet dans AI Studio ↗</a> · <a href="https://aistudio.google.com/rate-limit" target="_blank" rel="noreferrer">Limites Gemini ↗</a></p>
 {error&&<p className="message error" role="alert">{error}</p>}
 {loading?<p role="status">Chargement du suivi…</p>:usage&&<><div className="usage-summary">{(['shared','personal'] as const).map(source=><div key={source}><span>{source==='shared'?'Clé partagée du site':'Clés personnelles des utilisateurs'}</span><strong>{number(totals(source).calls)} appels</strong><small>{number(totals(source).tokens)} tokens déclarés ce mois-ci</small></div>)}</div>
 <h3>Ce mois-ci — {usage.month.slice(0,7)} (UTC)</h3>
 {usage.models.length?<div className="usage-table-wrap"><table className="usage-table"><caption>Appels observés sur CV-ATS, regroupés par modèle et origine de clé</caption><thead><tr><th>Clé / modèle</th><th>Appels tentés</th><th>Tokens déclarés</th><th>Détail des tokens</th><th>Suivi incomplet</th></tr></thead><tbody>{usage.models.map(m=><tr key={`${m.source}-${m.model}`}><td>{m.source==='shared'?'Partagée':'Personnelle'}<small>{m.model}</small></td><td>{number(m.attempted)}<small>{m.failed} analyses échouées</small></td><td>{number(m.tokens)}</td><td>Entrée : {number(m.prompt)}<br/>Sortie : {number(m.output)}<br/>Réflexion : {number(m.thought)}</td><td>{m.unknown} appels sans total de tokens<small>{m.pending} analyses en attente de clôture</small></td></tr>)}</tbody></table></div>:<p>Aucun appel enregistré ce mois-ci.</p>}
 <p className="auth-footnote">Ce suivi n’est ni une facture ni le quota restant chez Google. Il exclut les appels faits en dehors du site. Les comptes Google des utilisateurs peuvent être différents : leurs clés personnelles ne sont jamais affichées dans cet écran. Les tokens inconnus sont signalés, sans estimation. Une clé personnelle en erreur ne déclenche pas d’appel avec la clé partagée.</p></>}
 </section>;
}
export function UserConsumption({usage,onSaved}:{usage:UserUsage;onSaved:()=>void}){
 return <div className="user-quota"><p><strong>{usage.quota.used} / {usage.quota.limit} appels partagés</strong> utilisés ou réservés ce mois-ci</p><p>Clé du site : {usage.sharedCalls} appels · {number(usage.sharedTokens)} tokens</p><p>Clé personnelle : {usage.personalCalls} appels · {number(usage.personalTokens)} tokens</p><small>{usage.hasPersonalKey?'Clé personnelle configurée · hors quota interne':'Utilise la clé du site si disponible'}{usage.unknownCalls>0&&` · ${usage.unknownCalls} appels sans total connu`}</small><QuotaEditor quota={usage.quota} userId={usage.userId} onSaved={onSaved}/></div>;
}
