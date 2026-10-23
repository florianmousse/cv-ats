'use client';
import {useEffect,useRef,useState} from 'react';
import {cacheKey,decodeDraft,emptyWorkspace,encodeDraft,type WorkspaceDraft} from '@/lib/workspace-draft';

export function useWorkspaceDraft(owner:string){
 const [state,setState]=useState<WorkspaceDraft>(emptyWorkspace),[ready,setReady]=useState(false),[enabled,setEnabled]=useState(true),[status,setStatus]=useState('Chargement du brouillon…');
 const stopped=useRef(false),hydrated=useRef(false),latest=useRef({state,enabled});
 useEffect(()=>{
  function hydrate(){
   try{const active=localStorage.getItem(cacheKey(owner)+':enabled')!=='off';setEnabled(active);const restored=active?decodeDraft(localStorage.getItem(cacheKey(owner)),owner):null;latest.current={state:restored??emptyWorkspace(),enabled:active};if(restored)setState(restored);else localStorage.removeItem(cacheKey(owner));setStatus(restored?'Brouillon local restauré.':'Brouillon local prêt.');}
   catch{setStatus('Stockage local indisponible : exporte ou enregistre ton travail avant de quitter.');}
   hydrated.current=true;setReady(true);
  }
  hydrate();
  const logout=()=>{stopped.current=true;};window.addEventListener('cvats:logout',logout);
  const removedElsewhere=(event:StorageEvent)=>{if(event.key===cacheKey(owner)&&event.newValue===null){stopped.current=true;setStatus('Brouillon effacé dans un autre onglet : la reprise automatique est suspendue ici.');}};
  window.addEventListener('storage',removedElsewhere);
  const flush=()=>{if(stopped.current||!hydrated.current)return;try{if(latest.current.enabled)localStorage.setItem(cacheKey(owner),encodeDraft(owner,latest.current.state));}catch{/* The regular save already reports storage failures. */}};
  window.addEventListener('pagehide',flush);
  return()=>{window.removeEventListener('cvats:logout',logout);window.removeEventListener('storage',removedElsewhere);window.removeEventListener('pagehide',flush);};
 },[owner]);
 useEffect(()=>{
  if(!ready||stopped.current)return;latest.current={state,enabled};
  function persist(){try{localStorage.setItem(cacheKey(owner)+':enabled',enabled?'on':'off');if(enabled){localStorage.setItem(cacheKey(owner),encodeDraft(owner,state));setStatus('Brouillon conservé sur cet appareil pendant 7 jours.');}else{localStorage.removeItem(cacheKey(owner));setStatus('Cache désactivé : pense à exporter ou enregistrer ton travail.');}}catch{setStatus('Brouillon non sauvegardé : stockage plein ou bloqué. Exporte ton travail avant de quitter.');}}
  persist();
 },[owner,state,ready,enabled]);
 return {state,setState,ready,enabled,setEnabled,status};
}
