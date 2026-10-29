'use client';
import {effectiveFontSize,type ResumePresentation} from '@/lib/presentation';
export default function PDFLayoutStatus({pages,failed,design,disabled,onChange,onRetry}:{pages?:number;failed:boolean;design:ResumePresentation;disabled:boolean;onChange:(patch:Partial<ResumePresentation>)=>void;onRetry:()=>void}){
 const size=effectiveFontSize(design);
 return <div className={`pdf-layout-status ${pages&&pages>1?'pdf-overflow':''}`}>
  <p role="status">{failed?'La pagination est indisponible.':pages?`${pages} page${pages>1?'s':''} dans le PDF actuel`:'Calcul de la pagination du PDF…'}</p>
  {failed&&<button className="text-button" onClick={onRetry}>Réessayer</button>}
  {pages!==undefined&&pages>1&&<><p>Ton CV dépasse une page. Si tu vises une page, essaie un réglage à la fois ; tu peux toujours annuler.</p><div className="fit-actions">
   {design.density!=='compact'&&<button disabled={disabled} onClick={()=>onChange({density:'compact',fontSize:size})}>Resserrer les espacements</button>}
   {size>9&&<button disabled={disabled} onClick={()=>onChange({fontSize:size-1})}>Réduire de 1 pt ({size-1} pt)</button>}
   {size>10&&<button disabled={disabled} onClick={()=>onChange({fontSize:size-2})}>Réduire de 2 pt ({size-2} pt)</button>}
   {design.margins!=='narrow'&&<button disabled={disabled} onClick={()=>onChange({margins:'narrow'})}>Réduire les marges</button>}
  </div><small>Aucun contenu supprimé. Tu peux aussi raccourcir les répétitions et les missions les moins pertinentes. Deux pages restent possibles selon ton parcours.</small></>}
 </div>;
}
