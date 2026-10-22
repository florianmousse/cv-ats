'use client';
import {useState} from 'react';
import type {Scan} from '@/lib/cv';
import {diagnosticCategories,requirementCategories} from '@/lib/diagnostic-schema';

const statusLabels={ok:'Pas de point signalé',a_corriger:'Points à examiner',a_verifier:'À vérifier',non_evalue:'Non conclu'};
export function DiagnosticOverview({data}:{data:Scan}){
 return <section className="diagnostic-overview" aria-label="Contrôles éditoriaux">
  {data.mecanique&&<details className="editorial-checks mechanical-checks"><summary>Les 14 contrôles mécaniques <span>{data.mecanique.filter(c=>c.status==='ok').length} vérifiés · {data.mecanique.filter(c=>c.status==='attention').length} à examiner · {data.mecanique.filter(c=>c.status==='inconnu').length} non conclus</span></summary><div className="editorial-grid">{data.mecanique.map(check=><article key={check.id}><h4>{check.label}</h4><span className={`check-status check-${check.status==='attention'?'a_verifier':check.status==='inconnu'?'non_evalue':'ok'}`}>{check.status==='ok'?'Vérification effectuée':check.status==='attention'?'À examiner':'Non vérifiable ici'}</span><p>{check.detail}</p>{check.extrait&&<blockquote>{check.extrait}</blockquote>}</article>)}</div><p className="diagnostic-note">Même texte et mêmes données d’import : mêmes contrôles locaux, sans appel IA. Colonnes, tableaux et ordre de lecture visuel ne sont pas évalués. Aucune certification de compatibilité avec un logiciel de recrutement.</p></details>}
  {data.mesures&&<><div className="text-metrics"><div><strong>{data.mesures.mots}</strong><span>mots dans le texte</span></div><div><strong>{data.mesures.phrasesExperience}</strong><span>phrases d’expérience repérées</span></div><div><strong>{data.mesures.phrasesCourtes}</strong><span>phrases de moins de 6 mots</span></div><div><strong>{data.mesures.phrasesLongues}</strong><span>phrases de plus de 38 mots</span></div></div><p className="diagnostic-note">Repères locaux, sans pénalité automatique. Les lignes coupées sont rapprochées lorsque possible ; le repérage des phrases reste partiel. Un CV court ou une phrase brève n’est pas forcément un défaut.</p></>}
  {data.controles&&<details className="editorial-checks"><summary>Les 10 axes de relecture <span>Voir ce qui a été examiné</span></summary><div className="editorial-grid">{data.controles.map(check=><article key={check.categorie}><h4>{diagnosticCategories[check.categorie]}</h4><span className={`check-status check-${check.statut}`}>{statusLabels[check.statut]}</span><p>{check.constat}</p></article>)}</div><p className="diagnostic-note">Les conclusions de l’IA complètent les règles locales. « Non conclu » ne signifie pas « sans défaut ». {data.evaluation&&`${data.evaluation.rejectedSuggestions} suggestion(s) IA écartée(s) faute d’extrait, de correction exploitable ou parce qu’il s’agissait d’une limite d’analyse. `}La relecture IA peut varier entre deux analyses.</p></details>}
 </section>;
}

export function JobRequirements({data}:{data:Scan}){
 const [gapsOnly,setGapsOnly]=useState(true);
 if(!data.exigences?.length)return null;
 const order={experience:0,version:1,technique:2,mission:3,langue:4,qualite:5,contexte:6};
 const requirements=data.exigences.filter(item=>!gapsOnly||item.statut!=='mentionne').sort((a,b)=>order[a.categorie]-order[b.categorie]);
 const pending=data.exigences.filter(item=>item.statut!=='mentionne').length;
 const labels={mentionne:'Mention repérée',a_preciser:'À préciser',non_documente:'Non documenté'};
 return <section className="job-requirements" aria-labelledby="job-requirements-title"><div className="requirements-heading"><div><p className="eyebrow">L’ANNONCE FACE À TON PARCOURS</p><h3 id="job-requirements-title">Les exigences, au-delà des mots-clés</h3><p>{pending} point{pending>1?'s':''} à documenter ou préciser sur {data.exigences.length} éléments repérés.</p></div><label><input type="checkbox" checked={gapsOnly} onChange={e=>setGapsOnly(e.target.checked)}/> Seulement les points à vérifier</label></div>
  <p className="diagnostic-note">Une mention ne prouve ni la maîtrise, ni une durée d’utilisation. « Non documenté » signifie absent de ce CV, pas absent de ton parcours. Lis les alternatives et minimums de chaque extrait : tous les termes cités ne sont pas obligatoires.</p>
  <div className="requirement-list">{requirements.map((item,index)=><details key={`${item.categorie}-${item.terme}-${index}`} className="requirement-item"><summary><span><small>{requirementCategories[item.categorie]}</small><strong>{item.terme}</strong></span><span className={`requirement-status status-${item.statut}`}>{labels[item.statut]}</span></summary><div className="requirement-body"><div><h4>Dans l’annonce</h4><blockquote>{item.extraitAnnonce}</blockquote></div><div><h4>Dans le CV</h4>{item.preuveCV?<blockquote>{item.preuveCV}</blockquote>:<p>Aucune preuve textuelle retenue pour cette exigence.</p>}</div><p className="requirement-advice">{item.conseil}</p></div></details>)}</div>{!requirements.length&&<p>Aucun point supplémentaire à vérifier dans ce relevé. Les mentions repérées restent à relire dans leur contexte.</p>}
 </section>;
}
