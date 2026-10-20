'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {KeyStatus} from '@/lib/keys/personal';

export default function GeminiForm(){
 const [settings,setSettings]=useState<KeyStatus|null>(null),[apiKey,setApiKey]=useState(''),[model,setModel]=useState('');
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[revision,setRevision]=useState(0);
 useEffect(()=>{const controller=new AbortController();async function load(){setLoading(true);try{
  const response=await fetch('/api/account/gemini',{cache:'no-store',signal:controller.signal});const body=await response.json();if(!response.ok)throw new Error(body.error);
  setSettings(body.settings);
 }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Configuration indisponible.');}finally{if(!controller.signal.aborted)setLoading(false);}}
 void load();return()=>controller.abort();},[revision]);
 async function save(event:FormEvent){event.preventDefault();setBusy(true);setError('');setNotice('');
 // Keep the submitted key only for this request; never use local/session storage.
 const submittedKey=apiKey;setApiKey('');
 try{const response=await fetch('/api/account/gemini',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:submittedKey,model})});const body=await response.json();if(!response.ok)throw new Error(body.error);
  setNotice('Clé personnelle enregistrée. Les prochaines analyses utiliseront cette clé. Son accès à Gemini sera vérifié lors de la première analyse.');setRevision(v=>v+1);
 }catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.');}finally{setBusy(false);}}
 async function remove(){if(!window.confirm('Supprimer ta clé personnelle ? Les prochaines analyses utiliseront la clé du site si elle est disponible.'))return;
 setBusy(true);setError('');setNotice('');setApiKey('');try{const response=await fetch('/api/account/gemini',{method:'DELETE'});const body=await response.json();if(!response.ok)throw new Error(body.error);
 setNotice('Clé personnelle supprimée de CV-ATS. Elle n’a pas été révoquée chez Google.');setModel('');setRevision(v=>v+1);
 }catch(e){setError(e instanceof Error?e.message:'Suppression impossible.');}finally{setBusy(false);}}
 return <section className="auth-card gemini-card" aria-busy={busy||loading} aria-labelledby="gemini-heading"><p className="eyebrow">TON ESPACE IA</p><h2 id="gemini-heading">Ta clé. Ton autonomie.</h2><p>La clé du site offre un quota de découverte défini par l’administrateur. Ajoute ta clé Gemini pour continuer sans quota interne CV-ATS, avec les limites et la facturation éventuelle de ton projet Google.</p>
 <ol className="key-steps"><li><strong>Crée ta clé</strong><span>Ouvre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Google AI Studio ↗</a> avec ton compte Google et crée une clé pour ton projet.</span></li><li><strong>Enregistre-la ici</strong><span>Colle la clé dans le champ sécurisé ci-dessous. Elle sera conservée chiffrée.</span></li><li><strong>Reprends ton CV</strong><span>Ta clé devient prioritaire pour toutes tes prochaines analyses.</span></li></ol>
 {loading?<p role="status">Chargement…</p>:settings&&<><div className="key-status"><strong>{settings.hasPersonalKey?`Clé personnelle enregistrée · ••••${settings.hint}`:settings.sharedAvailable?'Clé du site utilisée':'Aucune clé disponible'}</strong><p>Modèle : {settings.model}</p>{settings.updatedAt&&<small>Enregistrée le {new Date(settings.updatedAt).toLocaleString('fr-FR')}</small>}</div>
 {!settings.canSave&&<p className="message error">L’enregistrement des clés personnelles nécessite la configuration du chiffrement par le propriétaire du site.</p>}
 <form onSubmit={save} className="auth-form"><label htmlFor="personal-api-key">{settings.hasPersonalKey?'Remplacer ma clé Gemini':'Ma clé API Gemini'}</label><input id="personal-api-key" type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} minLength={16} maxLength={512} required disabled={busy||!settings.canSave} placeholder="Colle ta clé personnelle"/>
 <label htmlFor="personal-model">Modèle Gemini (facultatif)</label><input id="personal-model" value={model} onChange={e=>setModel(e.target.value)} maxLength={100} autoComplete="off" spellCheck={false} disabled={busy||!settings.canSave} placeholder="Vide : modèle par défaut du site"/>
 <small>Pour changer le modèle, renseigne à nouveau ta clé. Un champ vide utilise le modèle par défaut du site.</small>
 <button className="primary-button" disabled={busy||!settings.canSave}>{busy?'Opération en cours…':settings.hasPersonalKey?'Remplacer ma clé':'Enregistrer ma clé'}</button></form>
 {settings.hasPersonalKey&&<button className="text-button danger-action" disabled={busy} onClick={remove}>Supprimer ma clé personnelle</button>}
 <p className="auth-footnote">La clé est chiffrée dans Supabase et utilisée uniquement côté serveur pour tes analyses. Elle n’est plus réaffichée après enregistrement. En cas d’erreur ou de quota Google atteint, aucune bascule automatique vers la clé du site n’a lieu.</p>
 <p className="auth-footnote">Les limites et la facturation éventuelle dépendent de ton projet Google. Deux clés du même projet partagent ses limites.</p></>}
 {error&&<p className="message error" role="alert">{error}</p>}{notice&&<p className="message success" role="status">{notice}</p>}
 <div className="button-row"><button className="text-button" disabled={busy||loading} onClick={()=>{setError('');setRevision(v=>v+1);}}>Actualiser</button><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-button">Créer ou gérer ma clé dans AI Studio ↗</a></div>
 </section>;
}
