import {type CV,type labels,additionalSections} from './cv';
import type {Content,ContentText,TDocumentDefinitions} from 'pdfmake/interfaces';
import {effectiveFontSize,type ResumePresentation} from './presentation';
import {resumeLinkParts} from './resume-links';
export type PDFStyle=ResumePresentation['template'];
export function createDefinition(cv:CV,style:PDFStyle,headings:typeof labels,design?:ResumePresentation):TDocumentDefinitions {
 const links=[cv.contact.portfolio,...(cv.projets??[]).map(p=>p.lien)];
 const linked=(value:string):ContentText['text']=>resumeLinkParts(value,links).map(part=>part.url?{text:part.text,link:part.url,decoration:'underline'}:{text:part.text});
 const finance=style==='finance',minimal=style==='minimal',compact=style==='compact'||design?.density==='compact',accent=style==='accent',executive=style==='executive';
 const size=design?effectiveFontSize(design):10,space=compact?.65:1;
 const color=design?.accent??(style==='modern'?'#1f3a5f':'#111111');
 const side=design?.margins==='narrow'?32:48,top=design?.margins==='narrow'?28:compact?32:minimal?55:43;
 const content:Content[]=[];
 const section=(title:string)=>{
  content.push({text:minimal?title.toLocaleUpperCase():title,style:'section',margin:[0,(minimal?23:17)*space,0,8*space],characterSpacing:minimal?.6:0,headlineLevel:1,decoration:finance||executive?'underline':undefined});
 };
 if(cv.nom)content.push({text:cv.nom,fontSize:compact?23:finance?23:26,bold:!minimal,color:accent?color:'#20252a',alignment:finance||executive?'center':'left',margin:[0,0,0,7*space]});
 if(cv.titre)content.push({text:linked(cv.titre),fontSize:size+2,bold:true,alignment:finance||executive?'center':'left',margin:[0,0,0,8*space]});
 const contact=Object.values(cv.contact).filter(Boolean).join(' · ');
 if(contact)content.push({text:linked(contact),fontSize:Math.max(9,size-1),alignment:finance||executive?'center':'left',margin:[0,0,0,5*space]});
 if(cv.profil){section(headings.profil);content.push({text:linked(cv.profil)});}
 if(cv.experiences.length){section(headings.experiences);for(const e of cv.experiences){
  const title=[e.poste,e.entreprise].filter(Boolean).join(' - ');
  if(title)content.push({text:linked(title),bold:true,margin:[0,8*space,0,3*space]});
  if(e.dates)content.push({text:e.dates,fontSize:Math.max(9,size-1),margin:[0,0,0,5*space]});
  if(e.puces.length)content.push({ul:e.puces.map(p=>({text:linked(p),margin:[0,0,0,4*space]})),margin:[0,0,0,5*space]});
 }}
 if(cv.competences.length){section(headings.competences);content.push({ul:cv.competences.map(c=>({text:linked(c),margin:[0,0,0,3*space]}))});}
 if(cv.formation.length){section(headings.formation);for(const f of cv.formation)content.push({text:linked([f.intitule,f.etablissement,f.dates,f.details].filter(Boolean).join(' - ')),margin:[0,0,0,8*space]});}
 for(const extra of additionalSections(cv,headings)){section(extra.title);for(const item of extra.items)content.push({text:linked(item),margin:[0,0,0,6*space]});}
 const last=content.at(-1);if(last&&typeof last==='object'&&'margin' in last&&Array.isArray(last.margin)&&last.margin.length===4)last.margin[3]=0;
 return {info:{title:cv.nom?`CV - ${cv.nom}`:'CV',creator:'CV-ATS'},pageSize:'A4',pageMargins:[side,top,side,design?.margins==='narrow'?28:43],defaultStyle:{font:finance?'Serif':'Roboto',fontSize:size,lineHeight:compact?1.1:minimal?1.45:1.25,color:'#20252a'},styles:{section:{fontSize:minimal?size:size+2,bold:true,color,background:accent?'#eef2f0':undefined}},content,pageBreakBefore:(node,container)=>Boolean(node.headlineLevel===1&&container.getFollowingNodesOnPage().length===0)};
}
let fontsReady:Promise<void>|undefined;
async function renderer(style:PDFStyle){
 const [{default:pdfMake},{default:fonts}]=await Promise.all([import('pdfmake/build/pdfmake'),import('pdfmake/build/vfs_fonts')]);
 pdfMake.addVirtualFileSystem(fonts);
 if(style==='finance'){
  fontsReady??=(async()=>{const response=await fetch('/fonts/serif-vfs.json');if(!response.ok)throw new Error('Police indisponible');pdfMake.addVirtualFileSystem(await response.json());pdfMake.addFonts({Serif:{normal:'DejaVuSerif.ttf',bold:'DejaVuSerif-Bold.ttf',italics:'DejaVuSerif.ttf',bolditalics:'DejaVuSerif-Bold.ttf'}});})().catch(error=>{fontsReady=undefined;throw error;});
  await fontsReady;
 }
 return pdfMake;
}
/** Page count comes from the final PDF layout, never from the HTML preview. */
export async function createCVDocument(cv:CV,style:PDFStyle,headings:typeof labels,design?:ResumePresentation):Promise<{blob:Blob;pages:number}>{
 const pdfMake=await renderer(style),definition=createDefinition(cv,style,headings,design);let pages=0;
 definition.footer=(_current,total)=>{pages=total;return {text:''};};
 const blob=await pdfMake.createPdf(definition).getBlob();
 if(!pages)throw new Error('Pagination indisponible');
 return {blob,pages};
}
export async function createCVBlob(cv:CV,style:PDFStyle,headings:typeof labels,design?:ResumePresentation):Promise<Blob>{return (await createCVDocument(cv,style,headings,design)).blob;}
export async function downloadCV(cv:CV,style:PDFStyle,headings:typeof labels,design?:ResumePresentation){
 const blob=await createCVBlob(cv,style,headings,design);
 const filename=(cv.nom||'CV').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70);
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${filename}-CV-ATS.pdf`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
