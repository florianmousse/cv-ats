'use client';
import {companySearchURL,researchError,type CompanyResearch} from '@/lib/company-research';

export default function CompanyResearchFields({value,onChange,disabled}:{value:CompanyResearch;onChange:(value:CompanyResearch)=>void;disabled:boolean}){
 const patch=(next:Partial<CompanyResearch>)=>onChange({...value,...next});
 const error=researchError(value);
 return <details className="context-drawer company-research">
  <summary>Personnaliser avec une actualité de l&apos;entreprise <span>Facultatif · source à renseigner</span></summary>
  <p>Choisis un projet, un produit ou une actualité qui explique ton intérêt pour ce poste. Une référence précise est plus utile qu&apos;un compliment général.</p>
  <label htmlFor="company-name">Entreprise visée</label><input id="company-name" value={value.company} maxLength={200} disabled={disabled} onChange={e=>patch({company:e.target.value})} placeholder="Nom de l'entreprise"/>
  {value.company.trim()&&<p><a href={companySearchURL(value.company)} target="_blank" rel="noopener noreferrer">Chercher ses actualités et publications officielles ↗</a></p>}
  <p className="field-hint">Privilégie une publication officielle et vérifie la date ainsi que l&apos;entreprise concernée. La recherche ouvre un nouvel onglet et transmet uniquement son nom au moteur de recherche.</p>
  <label htmlFor="company-source">Lien de la publication</label><input id="company-source" type="url" value={value.url} maxLength={1500} disabled={disabled} onChange={e=>patch({url:e.target.value})} placeholder="https://…"/>
  <label htmlFor="company-date">Date de publication (si connue)</label><input id="company-date" type="date" value={value.date} disabled={disabled} onChange={e=>patch({date:e.target.value})}/>
  <label htmlFor="company-excerpt">Court extrait utile que tu as vérifié dans la publication</label><textarea id="company-excerpt" rows={4} value={value.excerpt} maxLength={3000} disabled={disabled} onChange={e=>patch({excerpt:e.target.value})} placeholder="Colle le passage décrivant le projet ou l'actualité. Explique dans ta motivation ce qui te parle dans ce projet."/>
  <p className="field-hint">Le site ne consulte pas automatiquement le lien. La lettre utilise cet extrait seulement s&apos;il est pertinent ; sans extrait, elle s&apos;appuie sur l&apos;annonce. Aucun fait d&apos;actualité ne doit être inventé.</p>
  {error&&<p className="field-hint" role="status">{error}</p>}
 </details>;
}
