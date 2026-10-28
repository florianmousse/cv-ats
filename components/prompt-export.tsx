'use client';
import {useState} from 'react';
import {externalPrompt,type AnalysisMode} from '@/lib/candidature-prompts';
import type {CompanyResearch} from '@/lib/company-research';
export default function PromptExport({cv,job,notes,companyResearch}:{cv:string;job:string;notes:string;companyResearch?:CompanyResearch}){
 const [mode,setMode]=useState<AnalysisMode>('scan'),[message,setMessage]=useState('');
 const prompt=externalPrompt(mode,cv,job,notes,companyResearch);
 async function copy(){try{await navigator.clipboard.writeText(prompt);setMessage('Prompt copié. Relis les données avant de les transmettre à une autre IA.');}catch{setMessage('Copie indisponible : sélectionne le texte ci-dessous.');}}
 return <section className="prompt-export" id="prompts"><h2>Continuer avec une autre IA</h2><p>Disponible même sans quota. Le prompt utilise ton CV en cours et ton annonce. Aucun appel API, aucune transmission automatique.</p><label htmlFor="prompt-mode">Ce que tu veux préparer</label><select id="prompt-mode" value={mode} onChange={e=>{setMode(e.target.value as AnalysisMode);setMessage('');}}><option value="scan">Diagnostic et corrections</option><option value="optimize">CV adapté à l&apos;annonce</option><option value="structure">CV structuré</option><option value="letter">Lettre de motivation</option></select><p className="field-hint">La copie contient les coordonnées et informations du CV. Tu peux les anonymiser avant utilisation. Les conditions de l&apos;autre service s&apos;appliqueront.</p><button className="secondary-button" disabled={cv.trim().length<30} onClick={copy}>Copier le prompt prêt à l&apos;emploi</button>{message&&<p role="status">{message}</p>}<details><summary>Relire et sélectionner le prompt</summary><textarea aria-label="Prompt à copier" value={prompt} readOnly rows={12}/></details></section>;
}
