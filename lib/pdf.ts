import type {CV,labels} from './cv';
import type {Content,TDocumentDefinitions} from 'pdfmake/interfaces';
export type PDFStyle='modern'|'finance'|'minimal';
export function createDefinition(cv:CV,style:PDFStyle,headings:typeof labels):TDocumentDefinitions {
 const finance=style==='finance',minimal=style==='minimal';
 const content:Content[]=[];
 const section=(title:string)=>{
  content.push({text:minimal?title.toLocaleUpperCase():title,style:'section',margin:[0,minimal?23:17,0,8],characterSpacing:minimal?.6:0,headlineLevel:1});
  if(finance)content.push({canvas:[{type:'line',x1:0,y1:0,x2:499.28,y2:0,lineWidth:.55,lineColor:'#111111'}],margin:[0,-3,0,8]});
 };
 if(cv.nom)content.push({text:cv.nom,fontSize:finance?23:26,bold:!minimal,alignment:finance?'center':'left',margin:[0,0,0,7]});
 if(cv.titre)content.push({text:cv.titre,fontSize:12,bold:true,alignment:finance?'center':'left',margin:[0,0,0,8]});
 const contact=Object.values(cv.contact).filter(Boolean).join(' · ');
 if(contact)content.push({text:contact,fontSize:9,alignment:finance?'center':'left',margin:[0,0,0,5]});
 if(cv.profil){section(headings.profil);content.push({text:cv.profil});}
 if(cv.experiences.length){section(headings.experiences);for(const e of cv.experiences){
  const title=[e.poste,e.entreprise].filter(Boolean).join(' — ');
  if(title)content.push({text:title,bold:true,margin:[0,8,0,3]});
  if(e.dates)content.push({text:e.dates,fontSize:9,margin:[0,0,0,5]});
  if(e.puces.length)content.push({ul:e.puces.map(p=>({text:p,margin:[0,0,0,4]})),margin:[0,0,0,5]});
 }}
 if(cv.competences.length){section(headings.competences);content.push({ul:cv.competences.map(c=>({text:c,margin:[0,0,0,3]}))});}
 if(cv.formation.length){section(headings.formation);for(const f of cv.formation)content.push({text:[f.intitule,f.etablissement,f.dates].filter(Boolean).join(' — '),margin:[0,0,0,8]});}
 return {info:{title:cv.nom?`CV — ${cv.nom}`:'CV',creator:'CV-ATS'},pageSize:'A4',pageMargins:[48,minimal?55:43,48,43],defaultStyle:{font:finance?'Serif':'Roboto',fontSize:10,lineHeight:minimal?1.45:1.25,color:'#20252a'},styles:{section:{fontSize:minimal?10:12,bold:true,color:style==='modern'?'#1f3a5f':'#111111'}},content,pageBreakBefore:(node,container)=>Boolean(node.headlineLevel===1&&container.getFollowingNodesOnPage().length===0)};
}
export async function downloadCV(cv:CV,style:PDFStyle,headings:typeof labels){
 const [{default:pdfMake},{default:fonts}]=await Promise.all([import('pdfmake/build/pdfmake'),import('pdfmake/build/vfs_fonts')]);
 pdfMake.addVirtualFileSystem(fonts);
 if(style==='finance'){
  const response=await fetch('/fonts/serif-vfs.json');if(!response.ok)throw new Error('Police indisponible');
  pdfMake.addVirtualFileSystem(await response.json());
  pdfMake.addFonts({Serif:{normal:'DejaVuSerif.ttf',bold:'DejaVuSerif-Bold.ttf',italics:'DejaVuSerif.ttf',bolditalics:'DejaVuSerif-Bold.ttf'}});
 }
 const filename=(cv.nom||'CV').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,70);
 await pdfMake.createPdf(createDefinition(cv,style,headings)).download(`${filename}-CV-ATS.pdf`);
}
