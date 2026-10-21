'use client';
import {useRef,useState} from 'react';
import SavedCVs from '@/components/saved-cvs';
import UsageCard from '@/components/usage-card';
import PrivateHeader from '@/components/private-header';
import ResumeEditor from '@/components/resume-editor';
import type {OptimizedResult} from '@/lib/data/saves';
import KeywordWorkshop from '@/components/keyword-workshop';
import ScanReport from '@/components/scan-report';
import type { SiteUser } from '@/lib/auth/session';
import {ArrowRight,Check,FileText,Info,LoaderCircle,ScanLine,ShieldCheck,Sparkles,Upload,X,LockKeyhole,ChevronRight} from 'lucide-react';
import {type Scan} from '@/lib/cv';
type Result={kind:'scan';data:Scan}|OptimizedResult;
const education="Un ATS (Applicant Tracking System) est un logiciel que les entreprises utilisent pour recevoir, trier et classer les candidatures. Quand tu postules en ligne, ton CV passe souvent par lui avant qu'un humain ne le voie. Il lit le texte de ton CV, le compare à l'annonce, et classe les candidats. L'ATS ne te refuse presque jamais tout seul — il y a toujours un recruteur derrière —, mais un CV mal formaté ou pauvre en mots-clés peut être classé si bas qu'il n'est jamais consulté. Le but n'est pas de tromper le logiciel, mais que ton vrai profil soit bien lu et bien classé.";
export default function Workspace({user}:{user:SiteUser}){
 const [cv,setCV]=useState(''),[job,setJob]=useState(''),[busy,setBusy]=useState<''|'import'|'optimize'|'scan'>(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[result,setResult]=useState<Result|null>(null),[filename,setFilename]=useState('');
 const [saving,setSaving]=useState(false),[usageRevision,setUsageRevision]=useState(0),[resultRevision,setResultRevision]=useState(0),[saveIntent,setSaveIntent]=useState(0);
 const fileInput=useRef<HTMLInputElement>(null);const resultRef=useRef<HTMLElement>(null);
 function changed(value:string,which:'cv'|'job'){if(result?.kind==='optimize'&&!window.confirm('Modifier la source ou l’annonce effacera la version en cours d’édition. Enregistre-la d’abord pour la conserver. Continuer ?'))return;if(which==='cv'){setCV(value);setFilename('');}else setJob(value);setResult(null);setError('');setNotice('');}
 async function importFile(file?:File){
  if(!file)return;if(result?.kind==='optimize'&&!window.confirm('Importer un autre CV remplacera la version en cours d’édition. Enregistre-la d’abord pour la conserver. Continuer ?')){if(fileInput.current)fileInput.current.value='';return;}setError('');setNotice('');
  if(!/\.(pdf|docx)$/i.test(file.name)){setError('Choisis un fichier .pdf ou .docx.');return;}
  if(file.size>4*1024*1024){setError('Le fichier doit faire moins de 4 Mo.');return;}
  setBusy('import');
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{const body=new FormData();body.append('file',file);const response=await fetch('/api/import',{method:'POST',body,signal:controller.signal});const data=await response.json() as {text:string;error:string};if(!response.ok)throw new Error(data.error);setCV(data.text);setFilename(file.name);setResult(null);setNotice('Texte importé. Vérifie son contenu avant de lancer l’analyse.');}catch(e){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'L’import n’a pas abouti. Réessaie ou colle le texte manuellement.');}finally{clearTimeout(timer);setBusy('');if(fileInput.current)fileInput.current.value='';}
 }
 async function analyze(mode:'optimize'|'scan'){
  if(result?.kind==='optimize'&&!window.confirm('Relancer une analyse remplacera la version en cours d’édition. Enregistre-la d’abord si tu veux la conserver. Continuer ?'))return;
  setError('');setNotice('');if(cv.trim().length<30){setError('Ajoute ton CV (au moins 30 caractères) avant de lancer l’analyse.');return;}if(mode==='optimize'&&job.trim().length<30){setError('Ajoute l’annonce d’emploi (au moins 30 caractères) pour optimiser ton CV.');return;}
  setBusy(mode);setResult(null);const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),90000);
  try{const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,cv,job}),signal:controller.signal});const data=await response.json() as Result & {error:string};if(!response.ok)throw new Error(data.error);setResult(data.kind==='optimize'?{kind:'optimize',data:data.data,headings:data.headings}:{kind:'scan',data:data.data});setResultRevision(v=>v+1);setTimeout(()=>resultRef.current?.scrollIntoView({behavior:'smooth',block:'start'}),60);}catch(e){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'L’analyse a pris trop de temps. Réessaie.');}finally{clearTimeout(timer);setBusy('');setUsageRevision(v=>v+1);}
 }
 function saveEditedVersion(){setSaveIntent(v=>v+1);const drawer=document.getElementById("saved-versions") as HTMLDetailsElement|null;if(drawer){drawer.open=true;drawer.scrollIntoView({behavior:"smooth",block:"start"});document.getElementById("save-name")?.focus({preventScroll:true});}}
 return <div className="app-shell">
  <PrivateHeader user={user}/>
  <main>
   <section className="workspace" id="atelier">
    <div className="intro"><div><p className="eyebrow"><span/> UN CV FIDÈLE. MIEUX COMPRIS.</p><h1>Ton parcours mérite<br className="mobile-break"/> d’être <span>bien lu.</span></h1><p className="intro-description">Adapte ton CV à une annonce, sans jamais inventer ton expérience.</p></div><div className="honesty-note"><ShieldCheck size={21}/><div><strong>100 % ton parcours</strong><span>On reformule. On n’invente rien.</span></div></div></div>
    <div className="workspace-shortcuts"><a href="#mots-cles">Explorer les mots-clés <ArrowRight size={13}/></a><a href="#comprendre">Comprendre les ATS</a></div>
    <div className="journey"><span><b>01</b> Ajoute ton CV</span><span><b>02</b> Repère les améliorations</span><span><b>03</b> Exporte ta candidature</span></div>
    <details className="saved-drawer" id="saved-versions"><summary>Mes versions de CV <span>Enregistrer ou retrouver un parcours</span></summary>
    <SavedCVs saveIntent={saveIntent} cv={cv} job={job} result={result?.kind==='optimize'?result:null} disabled={!!busy} onWorking={setSaving} onLoad={saved=>{setCV(saved.cv);setJob(saved.job);setResult(saved.result);setResultRevision(v=>v+1);setFilename('');setError('');setNotice('');}}/>
    </details>
    <div className="editors">
     <article className="editor-card"><div className="editor-heading"><div className="editor-title"><span className="step">01</span><label htmlFor="cv">Ton CV</label></div><button className="import-button" disabled={!!busy||saving} onClick={()=>fileInput.current?.click()}>{busy==='import'?<LoaderCircle size={16} className="spin"/>:<Upload size={16}/>}Importer un fichier</button><input ref={fileInput} type="file" accept=".pdf,.docx" onChange={e=>importFile(e.target.files?.[0])} className="sr-only" tabIndex={-1} aria-label="Importer un CV au format PDF ou DOCX"/></div>
      <div className="editor-meta"><span>Le point de départ : ton vrai parcours.</span><span>PDF, DOCX · 4 Mo max.</span></div>
      <textarea id="cv" value={cv} disabled={!!busy||saving} maxLength={40000} onChange={e=>changed(e.target.value,'cv')} placeholder={'Colle le texte de ton CV ici…\n\nTes coordonnées\nTon expérience professionnelle\nTes compétences\nTa formation'} spellCheck={false}/>
      <div className="editor-footer"><span>{filename?<><FileText size={13}/>{filename}</>:<><LockKeyhole size={13}/>Enregistré uniquement à ta demande</>}</span><span>{cv.length.toLocaleString('fr-FR')} / 40 000</span></div>
     </article>
     <article className="editor-card"><div className="editor-heading"><div className="editor-title"><span className="step">02</span><label htmlFor="job">L’annonce d’emploi</label></div><span className="tag">Le poste que tu vises</span></div><div className="editor-meta"><span>Pour faire ressortir ce qui compte.</span><span>Facultative pour le scan</span></div><textarea id="job" value={job} disabled={!!busy||saving} maxLength={30000} onChange={e=>changed(e.target.value,'job')} placeholder={'Colle l’annonce d’emploi ici…\n\nL’intitulé du poste\nLes missions proposées\nLes compétences recherchées\nLe profil attendu'} spellCheck={false}/><div className="editor-footer"><span><Info size={13}/>Copie l’annonce complète pour plus de précision</span><span>{job.length.toLocaleString('fr-FR')} / 30 000</span></div></article>
    </div>
    <UsageCard revision={usageRevision}/>
    <div className="action-bar"><div className="action-buttons"><button onClick={()=>analyze('optimize')} disabled={!!busy||saving} className="primary-button">{busy==='optimize'?<LoaderCircle size={18} className="spin"/>:<Sparkles size={18}/>} {busy==='optimize'?'Optimisation en cours…':'Optimiser'}{busy!=='optimize'&&<ArrowRight size={17}/>}</button><button onClick={()=>analyze('scan')} disabled={!!busy||saving} className="secondary-button">{busy==='scan'?<LoaderCircle size={18} className="spin"/>:<ScanLine size={18}/>} {busy==='scan'?'Analyse en cours…':'Scanner mon CV'}</button></div><span className="action-help">Une annonce pour optimiser.<br/>Ton CV suffit pour un premier diagnostic.</span></div>
    <div className="privacy-line"><ShieldCheck size={14}/><strong>Aucune sauvegarde automatique.</strong><span>Tu choisis les versions à conserver.</span><a href="#confidentialite">En savoir plus</a></div>
    {error&&<div role="alert" className="message error"><Info size={18}/><p>{error}</p><button aria-label="Fermer le message d’erreur" onClick={()=>setError('')}><X size={16}/></button></div>}
    {notice&&<div role="status" className="message success"><Check size={18}/><p>{notice}</p></div>}
    <section ref={resultRef} className={'result-area '+(result?'has-result':'')+(result?.kind==='optimize'?' builder-result':'')} aria-label="Résultat" aria-live="polite" aria-busy={!!busy}>
     {!result&&!busy&&<div className="empty-result"><span className="empty-icon"><FileText size={26}/><span><Check size={10}/></span></span><h2>La prochaine version de ton CV commence ici.</h2><p>Ajoute tes textes, puis choisis une optimisation ou un scan.</p><div className="empty-features"><span><Check size={14}/> Fidèle à ton expérience</span><span><Check size={14}/> Lisible par les ATS</span><span><Check size={14}/> Prêt à copier ou télécharger</span></div></div>}
     {busy&&<div className="empty-result loading-result"><LoaderCircle className="spin" size={30}/><h2>{busy==='import'?'Extraction du texte…':busy==='scan'?'Lecture attentive de ton CV…':'Reformulation et vérification de ton CV…'}</h2><p>{busy==='import'?'Ton fichier est traité en mémoire.':'Cela peut prendre jusqu’à une minute. Garde cette page ouverte.'}</p></div>}
     {result?.kind==='optimize'&&<ResumeEditor key={resultRevision} result={result} source={cv} job={job} onChange={setResult} onSave={saveEditedVersion} disabled={saving||!!busy}/>}
     {result?.kind==='scan'&&<ScanReport data={result.data} hasJob={job.trim().length>=30} onOptimize={()=>analyze('optimize')}/>}
    </section>
   </section>
   <KeywordWorkshop cv={cv} job={job} suggested={result?.kind==='scan'?[...result.data.motsClesManquants,...(result.data.exigences??[]).filter(r=>r.categorie!=='experience').map(r=>r.terme)]:[]}/>
   <section className="education" id="comprendre"><div className="education-title"><p className="eyebrow">COMPRENDRE POUR MIEUX POSTULER</p><h2>Derrière les trois lettres.</h2></div><div className="education-grid"><article><h3>C’est quoi un ATS ?</h3><p>{education}</p></article><article className="checklist"><h3>Qu’est-ce qu’un CV optimisé ATS ?</h3><ul>{['du vrai texte sélectionnable jamais une image','une structure simple avec des sections standards','pas de tableaux/colonnes/zones de texte/en-têtes compliqués','les mots-clés de l’annonce quand on les possède vraiment, avec les mêmes termes','nom et coordonnées clairement lisibles'].map(t=><li key={t}><span><Check size={13}/></span>{t}</li>)}</ul><div className="honesty-bottom"><ShieldCheck size={18}/>Ton expérience est la seule source de vérité.</div></article></div></section>
   <section id="confidentialite" className="privacy-detail"><LockKeyhole size={18}/><div><h3>Tes données, sous ton contrôle.</h3><p>Les CV ne sont enregistrés que lorsque tu cliques sur « Enregistrer une nouvelle version ». Tu peux choisir d’y joindre l’annonce et le CV optimisé, puis supprimer chaque sauvegarde. Ces données restent privées à ton compte dans Supabase. Les comptes et droits sont gérés par Supabase Auth. Si tu enregistres une clé Gemini personnelle, elle est conservée chiffrée et utilisée côté serveur ; tu peux la supprimer dans Mon compte. Le suivi de consommation conserve uniquement des compteurs, dates, modèles et statuts, sans texte de CV. Les fichiers importés sont extraits en mémoire et ne sont pas conservés. Sans sauvegarde, les textes disparaissent à la fermeture ou à l’actualisation de la page. Lors d’une analyse, le CV et l’annonce sont transmis au service Gemini de Google, dont les règles de conservation s’appliquent. La suppression d’une sauvegarde dans CV-ATS ne supprime pas les éventuelles données conservées par Google selon ses propres conditions.</p></div></section>
  </main><footer><a href="#" className="footer-brand">CV—ATS</a><span>Mettre ton parcours en valeur. En toute honnêteté.</span><a href="#atelier">Retour à l’atelier <ChevronRight size={14}/></a></footer>
 </div>;
}
