'use client';
import {useEffect,useState,type FormEvent} from 'react';
import type {OptimizedResult,SavedCV,SavedSummary} from '@/lib/data/saves';

export default function SavedCVs({cv,job,result,disabled,onLoad,onWorking}:{cv:string;job:string;result:OptimizedResult|null;disabled:boolean;onLoad:(save:SavedCV)=>void;onWorking:(busy:boolean)=>void}){
 const [saves,setSaves]=useState<SavedSummary[]>([]),[selected,setSelected]=useState(''),[name,setName]=useState('');
 const [includeJob,setIncludeJob]=useState(false),[includeResult,setIncludeResult]=useState(false);
 const [loading,setLoading]=useState(true),[working,setWorking]=useState(false),[revision,setRevision]=useState(0),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{const controller=new AbortController();
  async function load(){setLoading(true);try{
   const r=await fetch('/api/cvs',{cache:'no-store',signal:controller.signal});const body=await r.json();if(!r.ok)throw new Error(body.error);
   setSaves(body.saves);
  }catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Chargement impossible.');}finally{if(!controller.signal.aborted)setLoading(false);}}
  void load();return()=>controller.abort();
 },[revision]);
 function start(){setWorking(true);onWorking(true);setError('');setNotice('');}
 function stop(){setWorking(false);onWorking(false);}
 async function save(event:FormEvent){event.preventDefault();start();try{
  const r=await fetch('/api/cvs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,cv,job:includeJob?job:'',result:includeResult?result:null})});
  const body=await r.json();if(!r.ok)throw new Error(body.error);
  setSelected(body.id);setRevision(v=>v+1);setNotice('Nouvelle version enregistrée dans ton espace privé.');
 }catch(e){setError(e instanceof Error?e.message:'Sauvegarde impossible.');}finally{stop();}}
 async function restore(){if(!selected)return;if(cv.trim()&&!window.confirm('Charger cette sauvegarde remplacera les textes et le résultat affichés. Continuer ?'))return;start();try{
  const r=await fetch(`/api/cvs/${selected}`,{cache:'no-store'});const body=await r.json();if(!r.ok)throw new Error(body.error);
  onLoad(body.save);setName(body.save.name);setIncludeJob(Boolean(body.save.job));setIncludeResult(Boolean(body.save.result));setNotice('Sauvegarde chargée. Tu peux modifier le texte sans changer la version enregistrée.');
 }catch(e){setError(e instanceof Error?e.message:'Chargement impossible.');}finally{stop();}}
 async function remove(){if(!selected||!window.confirm('Supprimer définitivement cette sauvegarde de ton espace ? Le texte actuellement affiché sera conservé.'))return;start();try{
  const r=await fetch(`/api/cvs/${selected}`,{method:'DELETE'});const body=await r.json();if(!r.ok)throw new Error(body.error);
  setSelected('');setRevision(v=>v+1);setNotice('Sauvegarde supprimée.');
 }catch(e){setError(e instanceof Error?e.message:'Suppression impossible.');}finally{stop();}}
 const locked=disabled||working;
 return <section className="saves-panel" aria-labelledby="saves-title" aria-busy={working||loading}>
  <div className="panel-heading"><div><h2 id="saves-title">Mes sauvegardes</h2><p>Enregistrement volontaire dans Supabase. Chaque version reste privée à ton compte.</p></div><span>{saves.length} / 20 versions</span></div>
  <div className="saves-grid"><form onSubmit={save}><label htmlFor="save-name">Nom de la nouvelle version</label><input id="save-name" value={name} onChange={e=>setName(e.target.value)} maxLength={100} required disabled={locked} placeholder="Ex. CV développeur — septembre"/>
   <label className="checkbox-label"><input type="checkbox" checked={includeJob} onChange={e=>setIncludeJob(e.target.checked)} disabled={locked}/>Conserver aussi l’annonce</label>
   <label className="checkbox-label"><input type="checkbox" checked={includeResult} onChange={e=>setIncludeResult(e.target.checked)} disabled={locked||!result}/>Conserver aussi le CV optimisé et ses exports{!result&&' (après optimisation)'}</label>
   <button className="secondary-button" disabled={locked||cv.trim().length<30||saves.length>=20}>{working?'Opération en cours…':'Enregistrer une nouvelle version'}</button>
  </form><div><label htmlFor="saved-cv">Charger une version enregistrée</label><select id="saved-cv" value={selected} onChange={e=>setSelected(e.target.value)} disabled={locked||loading}>
   <option value="">{loading?'Chargement…':'Choisir une sauvegarde'}</option>{saves.map(s=><option key={s.id} value={s.id}>{s.name} — {new Date(s.created_at).toLocaleDateString('fr-FR')}</option>)}</select>
   <div className="button-row"><button className="secondary-button" onClick={restore} disabled={locked||!selected||loading}>Charger</button><button className="secondary-button danger-action" onClick={remove} disabled={locked||!selected||loading}>Supprimer</button><button className="text-button" disabled={locked||loading} onClick={()=>{setError('');setRevision(v=>v+1);}}>Actualiser</button></div>
   <p>Le fichier PDF ou Word d’origine n’est jamais conservé. Aucun enregistrement automatique.</p>
  </div></div>{error&&<p className="message error" role="alert">{error}</p>}{notice&&<p className="message success" role="status">{notice}</p>}
 </section>;
}
