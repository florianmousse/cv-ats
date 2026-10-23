/** Plain paragraphs only; exported text is the user's current edited letter. */
export async function downloadLetter(text:string,format:'txt'|'docx'){
 let blob:Blob;
 if(format==='docx'){
  const {Document,Packer,Paragraph}=await import('docx');
  blob=await Packer.toBlob(new Document({creator:'CV-ATS',title:'Lettre de motivation',sections:[{children:text.split(/\r?\n/).map(line=>new Paragraph({text:line,spacing:{after:140}}))}]}));
 }else blob=new Blob([text],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`lettre-de-motivation.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
