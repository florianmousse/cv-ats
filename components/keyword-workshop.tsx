'use client';
import {useState} from 'react';
import {Check,Search} from 'lucide-react';
import {keywordMatcher,customKeywords,keywordGuides,extractJobKeywords,uniqueKeywords} from '@/lib/keywords';

export default function KeywordWorkshop({cv,job,suggested=[]}:{cv:string;job:string;suggested?:string[]}){
 const [role,setRole]=useState('annonce'),[custom,setCustom]=useState(''),[onlyMissing,setOnlyMissing]=useState(false);
 const inCV=keywordMatcher(cv),inOffer=keywordMatcher(job);
 const offerTerms=uniqueKeywords([...extractJobKeywords(job),...suggested.filter(t=>inOffer(t))]);
 const groups=role==='annonce'?[{title:'Les termes de ton annonce',terms:offerTerms}]:role==='custom'?[{title:'Les termes de ton annonce',terms:customKeywords(custom)}]:keywordGuides[role].groups;
 const terms=groups.flatMap(g=>g.terms),found=terms.filter(t=>inCV(t)).length;
 return <section className="keyword-workshop" id="mots-cles" aria-labelledby="keyword-heading">
  <div className="panel-heading"><div><p className="eyebrow">LES BONS MOTS, AU BON ENDROIT</p><h2 id="keyword-heading">Un CV précis commence ici.</h2><p>Pars des termes de ton annonce, puis complète avec les listes métier et tes propres mots-clés.</p></div><span className="local-badge"><Search size={14}/> Sans appel IA</span></div>
  <div className="keyword-toolbar"><div><label htmlFor="keyword-role">Liste à explorer</label><select id="keyword-role" value={role} onChange={e=>{setRole(e.target.value);setOnlyMissing(false);}}><option value="annonce">Dans mon annonce</option>{Object.entries(keywordGuides).map(([key,guide])=><option key={key} value={key}>{guide.label}</option>)}<option value="custom">Autre métier / ma propre liste</option></select></div><label className="keyword-filter"><input type="checkbox" checked={onlyMissing} onChange={e=>setOnlyMissing(e.target.checked)}/>Afficher seulement les termes non repérés</label></div>
  {role==='annonce'&&!job.trim()&&<p className="keyword-count">Ajoute une annonce pour repérer ses technologies, outils, versions, missions et langues. Les listes métier restent disponibles ci-dessus.</p>}
  {role==='annonce'&&job.trim()&&<p className="keyword-count">Repérage local élargi{suggested.length>0?' complété par les termes du scan IA':''}. Le scan détaille aussi les durées d’expérience et les exigences propres à ton offre.</p>}
  {role==='custom'&&<div className="custom-keywords"><label htmlFor="custom-keywords">Termes à vérifier, séparés par une virgule</label><textarea id="custom-keywords" value={custom} maxLength={2000} onChange={e=>setCustom(e.target.value)} placeholder="Ex. : gestion de stock, Excel, relation client"/><small>30 termes maximum. Reprends les formulations de ton offre.</small></div>}
  <div className="keyword-legend"><span><i className="legend-found"/>Repéré dans ton CV</span><span><i className="legend-job"/>Dans l’annonce, non repéré dans le CV</span><span><i/>À vérifier selon ton parcours</span></div>
  {cv.trim()?<p className="keyword-count"><strong>{found} / {terms.length}</strong> termes de cette liste repérés. Ce compteur n’est pas un score ATS.</p>:<p className="keyword-count">Ajoute ton CV dans l’atelier pour voir les termes déjà présents.</p>}
  <div className="keyword-groups">{groups.map(group=><article key={group.title}><h3>{group.title}</h3><div className="keyword-chips">{group.terms.filter(t=>!onlyMissing||!inCV(t)).map(term=>{const present=inCV(term),inJob=inOffer(term);return <span key={term} className={present?'found':inJob?'in-job':''}>{present&&<Check size={13}/>}<span>{term}</span><small>{present?'Repéré':inJob?'Dans l’annonce':'À vérifier'}</small></span>;})}</div>{onlyMissing&&group.terms.length>0&&group.terms.every(t=>inCV(t))&&<p>Tous les termes de ce groupe sont repérés.</p>}</article>)}</div>
  <p className="keyword-caution">Repérage textuel local : les synonymes ne sont pas tous reconnus. Ces listes ne sont ni exhaustives ni des exigences pour chaque poste. Ajoute une compétence uniquement si tu la maîtrises et si elle est pertinente pour l’offre.</p>
  <details className="writing-guide"><summary>Passer d’un mot-clé à une preuve concrète</summary><div className="before-after"><div><span>Une formule trop vague</span><p>« Participation au développement d’une application. »</p></div><div><span>Une structure à personnaliser</span><p>« Réalisé [fonctionnalité] avec [outil réellement utilisé] pour [besoin], avec [résultat vérifié]. »</p></div></div><p>Précise ta contribution, son contexte et son résultat. Si tu n’as pas de mesure fiable, décris un résultat observable sans inventer de chiffre. Garde tes intitulés contractuels dans les expériences.</p></details>
 </section>;
}
