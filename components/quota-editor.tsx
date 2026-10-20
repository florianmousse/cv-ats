'use client';
import {useState,type FormEvent} from 'react';
import type {SharedQuota} from '@/lib/data/usage';

export default function QuotaEditor({quota,userId,onSaved}:{quota:SharedQuota;userId?:string;onSaved:()=>void}){
 const [monthly,setMonthly]=useState(String(userId?(quota.override??''):quota.defaultLimit));
 const [daily,setDaily]=useState(String(quota.dailyLimit));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 async function save(event:FormEvent){event.preventDefault();setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch(userId?`/api/admin/users/${userId}/quota`:'/api/admin/usage',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(userId?{limit:monthly===''?null:Number(monthly)}:{dailyLimit:Number(daily),defaultMonthlyLimit:Number(monthly)})});
   const body=await response.json();if(!response.ok)throw new Error(body.error);
   setNotice('Quota enregistré.');onSaved();
  }catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.');}finally{setBusy(false);}
 }
 return <form className="quota-form" onSubmit={save}>
  {!userId&&<div><label htmlFor="daily-quota">Plafond du site / jour</label><input id="daily-quota" type="number" min="0" max="1000000" step="1" required disabled={busy} value={daily} onChange={e=>setDaily(e.target.value)}/></div>}
  <div><label htmlFor={`monthly-${userId??'default'}`}>{userId?'Quota personnel / mois':'Quota par défaut / compte / mois'}</label><input id={`monthly-${userId??'default'}`} type="number" min="0" max="1000000" step="1" required={!userId} disabled={busy} value={monthly} placeholder={String(quota.defaultLimit)} onChange={e=>setMonthly(e.target.value)}/></div>
  <button className="secondary-button small" disabled={busy}>{busy?'Enregistrement…':'Enregistrer le quota'}</button>
  <small>{userId?'Champ vide : suit la valeur par défaut. ':''}0 impose une clé personnelle. Unités : appels Gemini sur la clé du site.</small>
  {error&&<p role="alert" className="quota-error">{error}</p>}{notice&&<p role="status">{notice}</p>}
 </form>;
}
