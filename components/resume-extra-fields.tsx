'use client';
import {Plus} from 'lucide-react';
import {type CV,type labels,toPlainText} from '@/lib/cv';
import {moveItem} from '@/lib/resume-editor';
import {EditorSection,EntryActions,Field} from './resume-fields';
import LanguageReview from './language-review';

export default function AdditionalResumeFields({cv,headings,edit}:{cv:CV;headings:typeof labels;edit:(patch:Partial<CV>)=>void}){
 const langues=cv.langues??[],certifications=cv.certifications??[],projets=cv.projets??[],interets=cv.interets??[],autres=cv.autresSections??[];
 return <>
  <EditorSection title={`${headings.langues} (${langues.length})`}>
   {langues.map((l,i)=><div className="editable-entry" key={i}>
    <EntryActions label={`Langue ${i+1}`} index={i} count={langues.length} move={d=>edit({langues:moveItem(langues,i,d)})} remove={()=>edit({langues:langues.filter((_,j)=>i!==j)})}/>
    {([{key:'langue',label:'Langue'},{key:'niveau',label:'Niveau déclaré (ex. B2 autoévalué, bilingue)'},{key:'certification',label:'Certification et variante exacte'},{key:'score',label:'Score et sous-scores (si disponibles)'},{key:'date',label:'Date du test'}] as const).map(f=><Field key={f.key} label={`${f.label} ${i+1}`} value={l[f.key]} onChange={value=>edit({langues:langues.map((item,j)=>j===i?{...item,[f.key]:value}:item)})}/>)}
   </div>)}
   <button className="add-entry" disabled={langues.length>=20} onClick={()=>edit({langues:[...langues,{langue:'',niveau:'',certification:'',score:'',date:''}]})}><Plus size={15}/> Ajouter une langue</button>
   <LanguageReview text={toPlainText(cv,headings)}/>
  </EditorSection>
  <EditorSection title={`${headings.certifications} (${certifications.length})`}>
   {certifications.map((c,i)=><div className="editable-entry" key={i}><EntryActions label={`Certification ${i+1}`} index={i} count={certifications.length} move={d=>edit({certifications:moveItem(certifications,i,d)})} remove={()=>edit({certifications:certifications.filter((_,j)=>j!==i)})}/>
    {([{key:'intitule',label:'Intitulé de certification'},{key:'organisme',label:'Organisme certificateur'},{key:'date',label:'Date de certification'},{key:'details',label:'Précisions sur la certification'}] as const).map(f=><Field key={f.key} label={`${f.label} ${i+1}`} value={c[f.key]} onChange={value=>edit({certifications:certifications.map((item,j)=>j===i?{...item,[f.key]:value}:item)})}/>)}</div>)}
   <button className="add-entry" disabled={certifications.length>=30} onClick={()=>edit({certifications:[...certifications,{intitule:'',organisme:'',date:'',details:''}]})}><Plus size={15}/> Ajouter une certification</button>
   <p className="field-hint">Les certifications linguistiques peuvent rester dans Langues, sans les dupliquer ici.</p>
  </EditorSection>
  <EditorSection title={`${headings.projets} (${projets.length})`}>
   {projets.map((p,i)=><div className="editable-entry" key={i}><EntryActions label={`Projet ${i+1}`} index={i} count={projets.length} move={d=>edit({projets:moveItem(projets,i,d)})} remove={()=>edit({projets:projets.filter((_,j)=>j!==i)})}/>
    {([{key:'nom',label:'Nom du projet'},{key:'description',label:'Description et contribution réelle'},{key:'lien',label:'Lien du projet'}] as const).map(f=><Field key={f.key} multiline={f.key==='description'} label={`${f.label} ${i+1}`} value={p[f.key]} onChange={value=>edit({projets:projets.map((item,j)=>j===i?{...item,[f.key]:value}:item)})}/>)}</div>)}
   <button className="add-entry" disabled={projets.length>=30} onClick={()=>edit({projets:[...projets,{nom:'',description:'',lien:''}]})}><Plus size={15}/> Ajouter un projet</button>
  </EditorSection>
  <EditorSection title={`${headings.interets} (${interets.length})`}>
   {interets.map((value,i)=><div className="editable-entry" key={i}><EntryActions label={`Centre d'intérêt ${i+1}`} index={i} count={interets.length} move={d=>edit({interets:moveItem(interets,i,d)})} remove={()=>edit({interets:interets.filter((_,j)=>j!==i)})}/><Field label={`Activité et contexte ${i+1}`} multiline value={value} onChange={v=>edit({interets:interets.map((item,j)=>j===i?v:item)})}/></div>)}
   <button className="add-entry" disabled={interets.length>=30} onClick={()=>edit({interets:[...interets,'']})}><Plus size={15}/> Ajouter un centre d&apos;intérêt</button><p className="field-hint">Exemples : sport pratiqué, rôle associatif, activité créative. Décris ce qui est réel ; cette rubrique reste facultative. Si elle manque dans une ancienne version, retrouve son texte source dans « Comparer » pour la compléter.</p>
  </EditorSection>
  <EditorSection title={`Autres rubriques (${autres.length})`}>
   {autres.map((s,i)=><div className="editable-entry" key={i}><EntryActions label={`Rubrique ${i+1}`} index={i} count={autres.length} move={d=>edit({autresSections:moveItem(autres,i,d)})} remove={()=>edit({autresSections:autres.filter((_,j)=>j!==i)})}/><Field label={`Titre de rubrique ${i+1}`} value={s.titre} onChange={titre=>edit({autresSections:autres.map((item,j)=>j===i?{...item,titre}:item)})}/><Field label={`Contenu de rubrique ${i+1}`} multiline value={s.contenu} onChange={contenu=>edit({autresSections:autres.map((item,j)=>j===i?{...item,contenu}:item)})}/></div>)}
   <button className="add-entry" disabled={autres.length>=15} onClick={()=>edit({autresSections:[...autres,{titre:'',contenu:''}]})}><Plus size={15}/> Ajouter une rubrique</button><p className="field-hint">Pour les qualités, engagements, publications ou informations qui ne rentrent pas dans les rubriques ci-dessus.</p>
  </EditorSection>
 </>;
}
