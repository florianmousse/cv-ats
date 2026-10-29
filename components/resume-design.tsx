'use client';
import {Check} from 'lucide-react';
import {effectiveFontSize,templates,type ResumePresentation} from '@/lib/presentation';
export default function ResumeDesign({design,onChange}:{design:ResumePresentation;onChange:(patch:Partial<ResumePresentation>)=>void}){
 return <div className="design-panel"><h3>Le fond d&apos;abord. Le style ensuite.</h3><p>Six modèles à une colonne, avec du texte sélectionnable et des liens cliquables.</p>
  <div className="template-options">{templates.map(template=><button key={template.id} className={`template-option ${design.template===template.id?'selected':''}`} aria-pressed={design.template===template.id} onClick={()=>onChange({template:template.id})}><span className={`template-mini mini-${template.id}`} aria-hidden="true"><i/><i/><i/><i/><i/></span><span><strong>{template.name}</strong><small>{template.description}</small></span>{design.template===template.id&&<Check size={16}/>}</button>)}</div>
  <h4>Couleur des titres</h4><div className="color-options">{([{color:'#266c53',name:'Vert forêt'},{color:'#1f3a5f',name:'Bleu encre'},{color:'#614b75',name:'Prune'},{color:'#333333',name:'Graphite'}] as const).map(({color,name})=><button key={color} style={{background:color}} aria-label={name} aria-pressed={design.accent===color} onClick={()=>onChange({accent:color})}>{design.accent===color&&<Check size={17}/>}</button>)}</div>
  <h4>Densité du PDF</h4><div className="density-options">{([{id:'comfortable',name:'Confortable'},{id:'compact',name:'Compacte'}] as const).map(d=><button key={d.id} aria-pressed={design.density===d.id} onClick={()=>onChange({density:d.id})}>{d.name}</button>)}</div>
  <label className="resume-setting" htmlFor="resume-font-size">Taille du texte (points)<select id="resume-font-size" value={effectiveFontSize(design)} onChange={e=>onChange({fontSize:Number(e.target.value)})}>{[9,10,11,12].map(size=><option key={size} value={size}>{size} pt</option>)}</select></label>
  <label className="resume-setting" htmlFor="resume-margins">Marges du PDF<select id="resume-margins" value={design.margins??'standard'} onChange={e=>onChange({margins:e.target.value as ResumePresentation['margins']})}><option value="standard">Standard</option><option value="narrow">Réduites</option></select></label>
  <p className="field-hint">Le compteur mesure le PDF final après chaque modification. Garde une taille lisible : une deuxième page peut être préférable à un texte trop petit. Le Word conserve une présentation simple.</p>
 </div>;
}
