'use client';
import {useRef,useState} from 'react';
import SavedCVs from '@/components/saved-cvs';
import UsageCard from '@/components/usage-card';
import PrivateHeader from '@/components/private-header';
import ResumeEditor from '@/components/resume-editor';
import KeywordWorkshop from '@/components/keyword-workshop';
import ScanReport from '@/components/scan-report';
import PromptExport from '@/components/prompt-export';
import CompanyResearchFields from '@/components/company-research';
import {researchError} from '@/lib/company-research';
import LiveCorrections from '@/components/live-corrections';
import {useWorkspaceDraft} from '@/hooks/use-workspace-draft';
import {currentCV,emptyWorkspace,isScanStale,type WorkspaceDraft} from '@/lib/workspace-draft';
import {scanSchema} from '@/lib/cv';
import {optimizedSchema} from '@/lib/data/saves';
import {letterSchema,type AnalysisMode} from '@/lib/candidature-prompts';
import type {SiteUser} from '@/lib/auth/session';
import {LoaderCircle,Upload,ScanLine,Sparkles,FileText,Mail,Settings2} from 'lucide-react';

export default function Workspace({user}:{user:SiteUser}){
 const {state,setState,ready,enabled,setEnabled,status}=useWorkspaceDraft(user.id);
 const [busy,setBusy]=useState<AnalysisMode|'import'|''>(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [saving,setSaving]=useState(false),[revision,setRevision]=useState(0),[usageRevision,setUsageRevision]=useState(0),[saveIntent,setSaveIntent]=useState(0);
 const [proof,setProof]=useState<{text:string;value:string}|null>(null),[exporting,setExporting]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null);
 const text=currentCV(state),stale=isScanStale(state),locked=!!busy||saving;
 const patch=(value:Partial<WorkspaceDraft>)=>setState(previous=>({...previous,...value}));
 function tab(value:WorkspaceDraft['tab']){patch({tab:value});}
 function saveVersion(){setSaveIntent(v=>v+1);const drawer=document.getElementById('saved-versions') as HTMLDetailsElement|null;if(drawer){drawer.open=true;drawer.scrollIntoView({behavior:'smooth'});}}
 async function importFile(file?:File){
  if(!file)return;
  if(text&&!window.confirm('Importer un autre CV remplacera le dossier de travail actuel, y compris sa lettre et son diagnostic. Enregistre ou exporte les éléments à conserver. Continuer ?'))return;
  setError('');if(!/\.(pdf|docx)$/i.test(file.name)||file.size>4*1024*1024){setError('Choisis un PDF ou DOCX de moins de 4 Mo.');return;}
  setBusy('import');const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
  try{const form=new FormData();form.append('file',file);const response=await fetch('/api/import',{method:'POST',body:form,signal:controller.signal});const data=await response.json();if(!response.ok)throw new Error(data.error);setState({...emptyWorkspace(),text:data.text,source:data.text,filename:file.name});setProof(data.importProof?{text:data.text,value:data.importProof}:null);setRevision(v=>v+1);setNotice('CV importé. Tu peux corriger le texte, le scanner ou ouvrir l\'éditeur de mise en page.');}
  catch(e){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'Import interrompu. Le travail précédent est conservé.');}finally{clearTimeout(timer);setBusy('');if(fileInput.current)fileInput.current.value='';}
 }
 async function analyze(mode:AnalysisMode){
  setError('');setNotice('');
  if(text.trim().length<30||text.length>40000){setError('Le CV en cours doit contenir entre 30 et 40 000 caractères.');return;}
  if((mode==='optimize'||mode==='letter')&&state.job.trim().length<30){setError('Ajoute une annonce d\'au moins 30 caractères dans « Annonce et contexte ».');return;}
  if((mode==='optimize'||mode==='structure')&&state.draft&&!window.confirm('Créer une nouvelle proposition remplacera le contenu de l\'éditeur. Le diagnostic et la lettre seront conservés. Enregistrer ta version actuelle permet de la retrouver. Continuer ?'))return;
  if(mode==='letter'&&state.letter&&!window.confirm('Générer une nouvelle lettre remplacera le brouillon actuel si la génération réussit. Copie ou exporte la lettre à conserver. Continuer ?'))return;
  if(mode==='letter'){const error=researchError(state.companyResearch);if(error){setError(error);return;}}
  const cv=text,job=state.job,notes=state.notes,companyResearch=state.companyResearch;
  const letterContext=JSON.stringify({notes,companyResearch});
  setBusy(mode);const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),100000);
  try{
   const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,cv,job,notes,...(mode==='letter'?{companyResearch}:{}),...(proof?.text===cv?{importProof:proof.value}:{})}),signal:controller.signal});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'L\'opération n\'a pas abouti.');
   if(mode==='scan'){const scan=scanSchema.parse(data.data);setState(previous=>({...previous,scan:{data:scan,cv,job},tab:'diagnostic'}));setNotice('Diagnostic prêt. Ton CV éditable et ta lettre sont conservés.');}
   else if(mode==='letter'){const letter=letterSchema.parse(data.data);setState(previous=>({...previous,letter:letter.text,letterCV:cv,letterJob:job,letterContext,tab:'letter'}));setNotice('Lettre générée et vérifiée. Relis-la avant de l\'envoyer.');}
   else{const draft=optimizedSchema.parse({kind:'optimize',data:data.data,headings:data.headings});setState(previous=>({...previous,draft,source:cv,tab:'cv'}));setRevision(v=>v+1);setNotice('CV prêt à éditer. Tu peux conserver le diagnostic à côté pendant tes corrections.');}
  }catch(e){setError(e instanceof Error&&e.name!=='AbortError'?e.message:'L\'opération a pris trop de temps. Tes documents sont conservés.');}
  finally{clearTimeout(timer);setBusy('');setUsageRevision(v=>v+1);}
 }
 async function exportLetter(format:'txt'|'docx') {setExporting(true);try{const {downloadLetter}=await import('@/lib/letter-export');await downloadLetter(state.letter,format);}catch{setError('Export impossible. Tu peux toujours copier le texte de la lettre.');}finally{setExporting(false);}}
 async function copyLetter(){try{await navigator.clipboard.writeText(state.letter);setNotice('Lettre copiée.');}catch{setError('Sélectionne le texte de la lettre pour le copier manuellement.');}}
 if(!ready)return <div className="app-shell"><PrivateHeader user={user}/><main><p role="status">Chargement de ton dossier de travail…</p></main></div>;
 return <div className="app-shell candidature-shell"><PrivateHeader user={user}/><main>
  <section className="workspace" id="atelier">
   <div className="candidature-heading"><div><p className="eyebrow">UN DOSSIER, UN PARCOURS COHÉRENT</p><h1>Ta candidature, en cours.</h1><p>Prépare ton CV, corrige-le avec le diagnostic et rédige ta lettre.</p></div><button className="secondary-button small" disabled={locked} onClick={()=>fileInput.current?.click()}><Upload size={15}/> Importer un CV</button><input ref={fileInput} className="sr-only" type="file" accept=".pdf,.docx" aria-label="Importer un CV PDF ou DOCX" onChange={e=>importFile(e.target.files?.[0])}/></div>
   <div className="draft-cache"><div role="status">{status}</div><label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)}/> Reprendre sur cet appareil</label><button className="text-button" disabled={locked} onClick={()=>{if(window.confirm('Effacer le dossier de travail sur cet appareil ? Les versions enregistrées dans ton compte restent disponibles.')){setState(emptyWorkspace());setProof(null);setRevision(v=>v+1);setError('');setNotice('Dossier de travail effacé.');}}}>Effacer le brouillon</button></div>
   <details className="context-drawer" open={!text}><summary>Annonce et contexte <span>{state.job?'Annonce ajoutée':'Ajoute le poste visé'}</span></summary><label htmlFor="job">L&apos;annonce d&apos;emploi</label><textarea id="job" value={state.job} maxLength={30000} disabled={busy==='optimize'||busy==='structure'} onChange={e=>patch({job:e.target.value})} placeholder="Colle l'annonce complète. Facultative pour scanner ou structurer le CV."/><p>Le scan et la lettre conservent le contexte utilisé lors de leur génération. Changer l&apos;annonce ne supprime pas tes documents.</p></details>
   <details className="saved-drawer" id="saved-versions"><summary>Mes versions enregistrées <span>Conserver une étape dans mon compte</span></summary><SavedCVs saveIntent={saveIntent} cv={text} job={state.job} result={state.draft} disabled={locked} onWorking={setSaving} onLoad={saved=>{setState({...emptyWorkspace(),source:saved.cv,text:saved.cv,job:saved.job,draft:saved.result});setProof(null);setRevision(v=>v+1);setNotice('Version chargée dans le dossier de travail.');}}/></details>
   <nav className="workspace-tabs" aria-label="Étapes de la candidature">{([{id:'cv',label:'Mon CV',icon:FileText},{id:'diagnostic',label:'Diagnostic',icon:ScanLine},{id:'letter',label:'Lettre de motivation',icon:Mail},{id:'tools',label:'Outils et IA',icon:Settings2}] as const).map(item=><button key={item.id} aria-pressed={state.tab===item.id} onClick={()=>tab(item.id)}><item.icon size={17}/>{item.label}{item.id==='diagnostic'&&stale&&<span className="stale-dot" title="Diagnostic à actualiser">•</span>}</button>)}</nav>
   {error&&<div role="alert" className="message error"><p>{error}</p><button onClick={()=>tab('tools')}>Utiliser une autre IA →</button></div>}{notice&&<p role="status" className="message success">{notice}</p>}
   {busy&&<p className="operation-status" role="status"><LoaderCircle size={17} className="spin"/>{busy==='scan'?'Analyse de la version actuelle…':busy==='import'?'Extraction du fichier…':'Génération et vérification…'} Tes documents restent disponibles.</p>}
   <section hidden={state.tab!=='cv'} aria-label="Mon CV" id="cv">
    <div className="work-actions"><button className="primary-button" disabled={locked} onClick={()=>analyze('scan')}><ScanLine size={17}/> Scanner la version actuelle</button><button className="secondary-button" disabled={locked} onClick={()=>analyze('optimize')}><Sparkles size={17}/> Adapter à l&apos;annonce</button>{!state.draft&&<button className="secondary-button" disabled={locked} onClick={()=>analyze('structure')}>Ouvrir l&apos;éditeur de mise en page</button>}<small>Scan : 1 appel · adaptation ou structuration : jusqu&apos;à 2 appels IA</small></div>
    <div className={state.scan?'cv-with-diagnostic':'cv-without-diagnostic'}><div className="cv-working-document">
     {state.draft?<ResumeEditor key={revision} result={state.draft} source={state.source} job={state.job} onChange={draft=>patch({draft})} onSave={saveVersion} disabled={saving||busy==='optimize'||busy==='structure'} cacheStatus={status}/>:<article className="editor-card"><div className="editor-heading"><label htmlFor="cv-text">Texte du CV · édition libre</label><span>{state.filename||'Texte collé'}</span></div><textarea id="cv-text" value={state.text} maxLength={40000} disabled={busy==='optimize'||busy==='structure'} onChange={e=>patch({text:e.target.value})} placeholder="Importe ton CV ou colle son texte ici. Tu peux le corriger directement, avant ou après un scan." spellCheck/><div className="editor-footer">{state.text.length.toLocaleString('fr-FR')} / 40 000 caractères · Édition sans appel IA</div></article>}
    </div>{state.scan&&<LiveCorrections text={text} scan={state.scan.data} stale={stale} onScan={()=>analyze('scan')} disabled={locked}/>}</div>
   </section>
   <section hidden={state.tab!=='diagnostic'} className="diagnostic-workspace" aria-label="Diagnostic">
    <div className="work-actions"><button className="primary-button" disabled={locked} onClick={()=>analyze('scan')}>Rescanner la version actuelle</button><button className="secondary-button" onClick={()=>tab('cv')}>Corriger dans mon CV →</button></div>
    {stale&&<p className="stale-banner">Ce diagnostic porte sur une ancienne version du CV ou de l&apos;annonce. Ses conseils restent disponibles ; son score ne décrit pas tes dernières modifications.</p>}
    {state.scan?<div className="result-area has-result" onClick={event=>{const target=(event.target as HTMLElement).closest('a');if(target?.getAttribute('href')==='#cv'){event.preventDefault();tab('cv');}if(target?.getAttribute('href')==='#mots-cles'){event.preventDefault();tab('tools');}}}><ScanReport data={state.scan.data} hasJob={state.scan.job.trim().length>=30}/></div>:<div className="empty-result"><h2>Un diagnostic qui accompagne tes corrections.</h2><p>Lance un scan ; tu retrouveras ses conseils à côté du CV pendant l&apos;édition.</p></div>}
   </section>
   <section hidden={state.tab!=='letter'} className="letter-workspace" aria-label="Lettre de motivation"><div className="letter-heading"><h2>Une lettre qui parle de ton parcours.</h2><p>Trois paragraphes : Je - ton parcours et une preuve concrète ; Vous - un besoin précis de l&apos;entreprise ; Nous - ta contribution et une proposition d&apos;échange.</p></div><label htmlFor="letter-notes">Ta motivation et tes précisions (facultatif)</label><textarea id="letter-notes" disabled={busy==='letter'} value={state.notes} maxLength={4000} rows={3} onChange={e=>patch({notes:e.target.value})} placeholder="Pourquoi ce poste précisément ? Quelle mission t'intéresse, et pour quelle raison personnelle ?"/><CompanyResearchFields value={state.companyResearch} onChange={companyResearch=>patch({companyResearch})} disabled={busy==='letter'}/><div className="work-actions"><button className="primary-button" disabled={locked} onClick={()=>analyze('letter')}><Mail size={17}/> Générer une lettre</button><small>Jusqu&apos;à 2 appels IA, vérification de fidélité comprise. La rédaction manuelle reste gratuite.</small></div>
    {state.letterCV&&(state.letterCV!==text||state.letterJob!==state.job||(state.letterContext&&state.letterContext!==JSON.stringify({notes:state.notes,companyResearch:state.companyResearch})))&&<p className="stale-banner">Le CV, l&apos;annonce ou le contexte de la lettre a changé depuis la génération. Relis la lettre pour vérifier qu&apos;elle correspond toujours à ta candidature.</p>}
    <div className="letter-columns"><div><label htmlFor="letter-text">Ta lettre · modifiable librement</label><textarea id="letter-text" value={state.letter} maxLength={16000} onChange={e=>patch({letter:e.target.value})} disabled={busy==='letter'} rows={22} placeholder="Écris ta lettre ou colle une proposition obtenue avec une autre IA…"/><div className="work-actions"><button className="secondary-button" disabled={!state.letter} onClick={copyLetter}>Copier</button><button className="secondary-button" disabled={!state.letter||exporting} onClick={()=>exportLetter('docx')}>Télécharger Word</button><button className="text-button" disabled={!state.letter||exporting} onClick={()=>exportLetter('txt')}>Télécharger le texte</button></div></div><article className="letter-preview" aria-label="Aperçu de la lettre"><p className="eyebrow">APERÇU DU TEXTE</p><div>{state.letter||'Ta lettre apparaîtra ici au fil de tes modifications.'}</div></article></div>
   </section>
   <section hidden={state.tab!=='tools'} aria-label="Outils et IA"><UsageCard revision={usageRevision}/><PromptExport cv={text} job={state.job} notes={state.notes} companyResearch={state.companyResearch}/><KeywordWorkshop cv={text} job={state.job} suggested={state.scan?.data.motsClesManquants??[]}/><details className="context-drawer"><summary>Confidentialité et conservation</summary><p>Le brouillon automatique conserve le CV, l&apos;annonce, le diagnostic, le style et la lettre dans ce navigateur pendant sept jours après la dernière modification. Il est propre à ton compte, mais non chiffré sur l&apos;appareil : désactive-le sur un ordinateur partagé. Il est effacé à la déconnexion explicite. Tu peux l&apos;effacer ou désactiver la reprise à tout moment. Ce cache n&apos;est pas une sauvegarde durable : exporte les documents importants.</p><p>Les versions enregistrées volontairement restent privées dans Supabase. La lettre et le diagnostic sont conservés localement, pas dans ces versions de CV. Les clés API ne sont jamais placées dans le brouillon. Les fichiers importés ne sont pas conservés. Une analyse transmet les textes au service Gemini ; copier un prompt ne transmet rien à une autre IA tant que tu ne l&apos;y colles pas.</p></details></section>
  </section>
 </main></div>;
}
