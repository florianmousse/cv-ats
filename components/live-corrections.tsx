'use client';
import {useMemo} from 'react';
import {localDiagnostics} from '@/lib/diagnostic';
import type {Scan} from '@/lib/cv';
export default function LiveCorrections({text,scan,stale,onScan,disabled}:{text:string;scan:Scan|null;stale:boolean;onScan:()=>void;disabled:boolean}){
 const local=useMemo(()=>localDiagnostics(text).issues.filter(p=>p.extrait),[text]);
 const normalize=(s:string)=>s.replace(/\s+/g,' ').trim();
 return <aside className="live-corrections" aria-label="Corrections pendant l'édition"><h3>Corriger avec le diagnostic</h3><p>{stale?'Le CV ou l\'annonce a changé depuis le scan.':'Les repérages locaux suivent le texte en cours.'}</p><details open><summary>{local.length} repérages locaux en direct</summary>{local.length?local.map((p,i)=><details key={i}><summary>{p.texte}</summary><blockquote>{p.extrait}</blockquote><p>{p.correction}</p></details>):<p>Aucun point repéré par ces règles limitées. Cela ne remplace pas une relecture.</p>}</details>{scan&&<details open><summary>Corrections du dernier scan</summary>{scan.problemes.map((p,i)=>{const present=p.extrait&&normalize(text).includes(normalize(p.extrait));return <details key={i}><summary>{p.texte}<small>{p.extrait?(present?'Extrait encore présent':'Extrait modifié · à relire'):'À vérifier manuellement'}</small></summary>{p.extrait&&<blockquote>{p.extrait}</blockquote>}<p>{p.correction}</p></details>;})}</details>}<p className="field-hint">Un extrait modifié n&apos;est pas une correction validée. Le score reste celui du dernier scan ; seul un nouveau scan réévalue le CV.</p><button className="secondary-button small" disabled={disabled||text.trim().length<30} onClick={onScan}>Rescanner la version actuelle</button></aside>;
}
