import type {CSSProperties} from 'react';
import type {CV,labels} from '@/lib/cv';
import type {ResumePresentation} from '@/lib/presentation';

export default function ResumePreview({cv,headings,design}:{cv:CV;headings:typeof labels;design:ResumePresentation}){
 return <article className={`resume-sheet template-${design.template} density-${design.density}`} style={{'--resume-accent':design.accent} as CSSProperties} aria-label="Aperçu du CV modifié">
  <header className="resume-identity"><h2>{cv.nom||'Ton nom'}</h2>{cv.titre&&<p className="resume-title">{cv.titre}</p>}<p className="resume-contact">{Object.values(cv.contact).filter(Boolean).join(' · ')}</p></header>
  {cv.profil&&<section><h3>{headings.profil}</h3><p>{cv.profil}</p></section>}
  {cv.experiences.length>0&&<section><h3>{headings.experiences}</h3>{cv.experiences.map((exp,i)=><div className="resume-entry" key={i}><h4>{[exp.poste,exp.entreprise].filter(Boolean).join(' — ')}</h4>{exp.dates&&<p className="resume-dates">{exp.dates}</p>}<ul>{exp.puces.filter(Boolean).map((point,j)=><li key={j}>{point}</li>)}</ul></div>)}</section>}
  {cv.competences.length>0&&<section><h3>{headings.competences}</h3><ul className="resume-skills">{cv.competences.filter(Boolean).map((skill,i)=><li key={i}>{skill}</li>)}</ul></section>}
  {cv.formation.length>0&&<section><h3>{headings.formation}</h3>{cv.formation.map((item,i)=><div className="resume-entry" key={i}><h4>{item.intitule}</h4><p>{[item.etablissement,item.dates].filter(Boolean).join(' — ')}</p></div>)}</section>}
 </article>;
}
