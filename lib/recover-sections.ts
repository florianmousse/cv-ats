import {cvSchema,type CV} from './cv';
import {safeResumeURL} from './resume-links';

type ExtraKey='langues'|'interets'|'projets'|'certifications'|'autresSections';
const normalize=(value:string)=>value.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\u2019']/g,' ').replace(/[^a-z ]/g,' ').replace(/\s+/g,' ').trim();
const headings:Record<string,ExtraKey|false>={
 'langues':'langues','languages':'langues','langues et certifications':'langues',
 'centres d interet':'interets','centres d interets':'interets','interets':'interets','loisirs':'interets','interests':'interets','hobbies':'interets',
 'projets':'projets','projets personnels':'projets','projects':'projets',
 'certifications':'certifications','certificats':'certifications',
 'qualites':'autresSections','engagements':'autresSections','benevolat':'autresSections','publications':'autresSections',
 'contact':false,'coordonnees':false,'profil':false,'profile':false,'resume':false,'experiences':false,'experience':false,'experiences professionnelles':false,'experience professionnelle':false,'experience professionnelle et projets':false,'formation':false,'formations':false,'education':false,'competences':false,'skills':false,'informatique':false,'competences informatique':false,'competences informatiques':false,
};

/** Recover only explicitly titled sections, verbatim. Never infer a skill or language level. */
export function recoverSections(cv:CV,source:string,includeEmpty=false):{data:CV;recovered:string[]}{
 const blocks:{key:ExtraKey;title:string;lines:string[]}[]=[];
 let active:typeof blocks[number]|undefined;
 for(const raw of source.split(/\r?\n/)){
  const line=raw.trim().replace(/^[•*]\s*/,'');if(!line)continue;
  const key=normalize(line);
  if(Object.hasOwn(headings,key)){
   const section=headings[key];active=section?{key:section,title:line,lines:[]}:undefined;if(active)blocks.push(active);continue;
  }
  // Unknown uppercase headings terminate the section rather than swallowing unrelated content.
  if(line.length<70&&/[A-ZÀ-Ÿ]{3}/.test(line)&&line===line.toLocaleUpperCase('fr')&&!/\b(?:TOEIC|IELTS|TOEFL|B2|C1|C2)\b/.test(line)){active=undefined;continue;}
  active?.lines.push(line);
 }
 const patch:Partial<CV>={},recovered:string[]=[];
 for(const key of ['langues','interets','projets','certifications','autresSections'] as const){
  if(cv[key]!==undefined&&(!includeEmpty||cv[key]!.length))continue;
  const matching=blocks.filter(b=>b.key===key&&b.lines.length),lines=matching.flatMap(b=>b.lines);
  if(!lines.length)continue;
  if(key==='interets')patch.interets=lines.slice(0,30);
  if(key==='langues')patch.langues=lines.slice(0,20).map(line=>{
   const language=line.match(/\b(allemand|anglais|français|espagnol|italien|portugais|arabe|chinois|japonais|russe|néerlandais|english|german|french|spanish)\b/i);
   const remainder=language?line.replace(language[0],'').trim().replace(/^[-\u2013\u2014:|]+\s*/, '').replace(/\s*[-\u2013\u2014:|]+$/, ''):line;
   return {langue:language?.[0]??'',niveau:line.includes(remainder)?remainder:line,certification:'',score:'',date:''};
  });
  if(key==='certifications')patch.certifications=lines.slice(0,30).map(intitule=>({intitule,organisme:'',date:'',details:''}));
  if(key==='projets')patch.projets=matching.slice(0,30).map(b=>{const lien=b.lines.find(line=>safeResumeURL(line))??'';return {nom:'',description:b.lines.filter(line=>line!==lien).join('\n'),lien};});
  if(key==='autresSections')patch.autresSections=matching.slice(0,15).map(b=>({titre:b.title,contenu:b.lines.join('\n')}));
  recovered.push(...matching.map(b=>b.title));
 }
 if(!recovered.length)return {data:cv,recovered};
 const parsed=cvSchema.safeParse({...cv,...patch});
 return parsed.success?{data:parsed.data,recovered}:{data:cv,recovered:[]};
}
