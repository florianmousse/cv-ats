import {Document,Packer,Paragraph,TextRun,HeadingLevel,AlignmentType} from 'docx';
import {type CV,labels} from './cv';

/** One column, real paragraphs, no tables, floating text, headers or images. */
export async function buildDocx(cv:CV,headings=labels):Promise<Blob>{
 const paragraphs:Paragraph[]=[];
 const text=(value:string,bold=false)=>{if(value)paragraphs.push(new Paragraph({children:[new TextRun({text:value,bold})],spacing:{after:100}}));};
 const heading=(value:string)=>paragraphs.push(new Paragraph({text:value,heading:HeadingLevel.HEADING_1,spacing:{before:220,after:120},keepNext:true}));
 if(cv.nom)paragraphs.push(new Paragraph({text:cv.nom,heading:HeadingLevel.TITLE,alignment:AlignmentType.LEFT}));
 text(cv.titre,true);text(Object.values(cv.contact).filter(Boolean).join(' · '));
 if(cv.profil){heading(headings.profil);text(cv.profil);}
 if(cv.experiences.length){heading(headings.experiences);for(const experience of cv.experiences){text([experience.poste,experience.entreprise].filter(Boolean).join(' — '),true);text(experience.dates);for(const bullet of experience.puces)paragraphs.push(new Paragraph({text:bullet,bullet:{level:0},spacing:{after:90}}));}}
 if(cv.competences.length){heading(headings.competences);for(const skill of cv.competences)paragraphs.push(new Paragraph({text:skill,bullet:{level:0}}));}
 if(cv.formation.length){heading(headings.formation);for(const formation of cv.formation)text([formation.intitule,formation.etablissement,formation.dates].filter(Boolean).join(' — '));}
 return Packer.toBlob(new Document({creator:'CV-ATS',title:'CV',styles:{default:{document:{run:{font:'Arial',size:22,color:'171717'}}}},sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1000,right:1000,bottom:1000,left:1000}}},children:paragraphs}]}));
}
export async function downloadDocx(cv:CV,headings=labels){
 const blob=await buildDocx(cv,headings);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='CV-ATS.docx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
