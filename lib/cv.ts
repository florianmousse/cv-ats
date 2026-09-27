import { z } from 'zod';
const text = z.string().max(12000);
export const cvSchema = z.object({
  nom: text, titre: text,
  contact: z.object({ville:text, telephone:text, email:text, portfolio:text}).strict(),
  profil:text,
  experiences:z.array(z.object({poste:text, entreprise:text, dates:text, puces:z.array(text).max(30)}).strict()).max(40),
  competences:z.array(text).max(100),
  formation:z.array(z.object({intitule:text, etablissement:text, dates:text}).strict()).max(30)
}).strict();
export const scanSchema=z.object({score:z.number().int().min(0).max(100),pointsForts:z.array(text).max(30),problemes:z.array(z.object({severite:z.enum(['élevée','moyenne','faible']),texte:text}).strict()).max(30),motsClesManquants:z.array(text).max(60),recommandations:z.array(text).max(30)}).strict();
export type CV=z.infer<typeof cvSchema>;
export type Scan=z.infer<typeof scanSchema>;
export function parseModelJSON(raw:string):unknown {
  try { return JSON.parse(raw); } catch { /* tolerate prose and fences */ }
  for(let start=raw.indexOf('{');start>=0;start=raw.indexOf('{',start+1)) {
    let depth=0,quoted=false,escaped=false;
    for(let i=start;i<raw.length;i++) {
      const c=raw[i];
      if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
      if(c==='"')quoted=true;
      else if(c==='{')depth++;
      else if(c==='}'&&--depth===0){try{return JSON.parse(raw.slice(start,i+1));}catch{break;}}
    }
  }
  throw new Error('La réponse reçue est illisible. Réessaie.');
}
export const labels={profil:'Profil',experiences:'Expérience professionnelle',competences:'Compétences',formation:'Formation'};
export function toPlainText(cv:CV, headings=labels) {
  const blocks=[cv.nom,cv.titre,Object.values(cv.contact).filter(Boolean).join(' · ')].filter(Boolean);
  if(cv.profil)blocks.push(headings.profil.toUpperCase()+'\n'+cv.profil);
  if(cv.experiences.length)blocks.push(headings.experiences.toUpperCase()+'\n'+cv.experiences.map(e=>[ [e.poste,e.entreprise].filter(Boolean).join(' — '),e.dates,...e.puces.map(p=>'• '+p)].filter(Boolean).join('\n')).join('\n\n'));
  if(cv.competences.length)blocks.push(headings.competences.toUpperCase()+'\n'+cv.competences.map(c=>'• '+c).join('\n'));
  if(cv.formation.length)blocks.push(headings.formation.toUpperCase()+'\n'+cv.formation.map(f=>[f.intitule,f.etablissement,f.dates].filter(Boolean).join(' — ')).join('\n'));
  return blocks.join('\n\n');
}
export function assertGroundedFields(cv:CV,source:string) {
  const norm=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/\s/g,'');
  const src=norm(source);
  const immutable=[cv.nom,...Object.values(cv.contact),...cv.experiences.flatMap(e=>[e.poste,e.entreprise,e.dates]),...cv.formation.flatMap(f=>[f.intitule,f.etablissement,f.dates])];
  if(immutable.some(s=>s&&!src.includes(norm(s))))throw new Error('Certaines informations ne correspondent pas exactement au CV source. Par sécurité, le résultat a été écarté. Réessaie.');
  const numbers=JSON.stringify(cv).match(/\d+(?:[.,]\d+)?/g)??[];
  if(numbers.some(n=>!source.includes(n)))throw new Error('Un chiffre non présent dans le CV a été détecté. Le résultat a été écarté. Réessaie.');
}
