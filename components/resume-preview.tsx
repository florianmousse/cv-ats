import type {CSSProperties} from 'react';
import {type CV,type labels,additionalSections} from '@/lib/cv';
import {effectiveFontSize,type ResumePresentation} from '@/lib/presentation';
import {resumeLinkParts} from '@/lib/resume-links';
function LinkedText({text,links}:{text:string;links:string[]}){return <>{resumeLinkParts(text,links).map((part,i)=>part.url?<a key={i} href={part.url} target="_blank" rel="noreferrer">{part.text}</a>:part.text)}</>;}

export default function ResumePreview({cv,headings,design}:{cv:CV;headings:typeof labels;design:ResumePresentation}){
 const links=[cv.contact.portfolio,...(cv.projets??[]).map(p=>p.lien)];
 return <article className={`resume-sheet template-${design.template} density-${design.density} margins-${design.margins??'standard'}`} style={{'--resume-accent':design.accent,'--resume-font':`${effectiveFontSize(design)*1.2}px`} as CSSProperties} aria-label="Aperçu du CV modifié">
  <header className="resume-identity"><h2>{cv.nom||'Ton nom'}</h2>{cv.titre&&<p className="resume-title">{cv.titre}</p>}<p className="resume-contact"><LinkedText links={links} text={Object.values(cv.contact).filter(Boolean).join(' · ')}/></p></header>
  {cv.profil&&<section><h3>{headings.profil}</h3><p><LinkedText links={links} text={cv.profil}/></p></section>}
  {cv.experiences.length>0&&<section><h3>{headings.experiences}</h3>{cv.experiences.map((exp,i)=><div className="resume-entry" key={i}><h4>{[exp.poste,exp.entreprise].filter(Boolean).join(' - ')}</h4>{exp.dates&&<p className="resume-dates">{exp.dates}</p>}<ul>{exp.puces.filter(Boolean).map((point,j)=><li key={j}><LinkedText links={links} text={point}/></li>)}</ul></div>)}</section>}
  {cv.competences.length>0&&<section><h3>{headings.competences}</h3><ul className="resume-skills">{cv.competences.filter(Boolean).map((skill,i)=><li key={i}>{skill}</li>)}</ul></section>}
  {cv.formation.length>0&&<section><h3>{headings.formation}</h3>{cv.formation.map((item,i)=><div className="resume-entry" key={i}><h4>{item.intitule}</h4><p>{[item.etablissement,item.dates,item.details].filter(Boolean).join(' - ')}</p></div>)}</section>}
  {additionalSections(cv,headings).map((section,i)=><section key={i}><h3>{section.title}</h3>{section.items.map((item,j)=><p key={j} style={{whiteSpace:'pre-wrap'}}><LinkedText links={links} text={item}/></p>)}</section>)}
 </article>;
}
