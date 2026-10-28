'use client';
import {useMemo} from 'react';
import {languageChecks,languageSources} from '@/lib/language-checks';

export default function LanguageReview({text}:{text:string}){
 const checks=useMemo(()=>languageChecks(text),[text]);
 return <div className="language-review"><h4>Langues : vérifier les mentions</h4><p className="field-hint">Contrôle local de cohérence, sans appel IA. Il ne vérifie ni l&apos;authenticité du certificat ni ton niveau réel. « Bilingue » n&apos;est pas automatiquement C2 ; un niveau autoévalué est possible sans certificat.</p>
  {checks.map((check,i)=><details key={i}><summary>{check.status==='info'?'Repère':'À vérifier'} · {check.title}</summary><blockquote>{check.excerpt}</blockquote><p>{check.detail}</p></details>)}
  {!checks.length&&<p className="field-hint">Indique la langue, le niveau que tu peux justifier et, si tu en as une, la certification exacte avec score et date. Les repères de scores intégrés concernent TOEIC Listening & Reading.</p>}
  <details><summary>Références officielles</summary><ul>{languageSources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></li>)}</ul></details>
 </div>;
}
