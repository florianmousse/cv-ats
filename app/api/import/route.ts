import { requireUser } from '@/lib/auth/session';
import {extractText,getDocumentProxy} from 'unpdf';
import mammoth from 'mammoth/mammoth.browser';
import {unzipSync} from 'fflate';
import {json,PublicError,readLimited,checkOrigin} from '@/lib/http';
export const runtime='nodejs';
export const maxDuration=60;
const MAX=4*1024*1024;
export async function POST(req:Request){
 try{
  checkOrigin(req);
    await requireUser(req);
  const bytes=await readLimited(req,MAX+65536);
  const form=await new Response(bytes,{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();
  const file=form.get('file');if(!(file instanceof File))throw new PublicError('Sélectionne un fichier PDF ou DOCX.');
  if(file.size>MAX)throw new PublicError('Le fichier doit faire moins de 4 Mo.',413);
  const data=new Uint8Array(await file.arrayBuffer());let text='';
  if(file.name.toLowerCase().endsWith('.pdf')){
   if(new TextDecoder().decode(data.slice(0,5))!=='%PDF-')throw new PublicError('Ce fichier n’est pas un PDF valide.');
   const pdf=await getDocumentProxy(data,{verbosity:0,maxImageSize:1_000_000});
   try{
    if(pdf.numPages>25)throw new PublicError('Le PDF dépasse 25 pages. Importe uniquement les pages du CV.');
    const extracted=await extractText(pdf,{mergePages:true});text=extracted.text;
    if(!text.trim())throw new PublicError('Ce PDF semble être une image scannée : l’ATS ne pourra pas le lire non plus. Colle le texte manuellement.',422);
   }finally{await pdf.loadingTask.destroy();}
  }else if(file.name.toLowerCase().endsWith('.docx')){
   if(data[0]!==0x50||data[1]!==0x4b)throw new PublicError('Ce fichier n’est pas un DOCX valide.');
   let expanded=0;let hasDocument=false;
   // Inspect declared expanded sizes before Mammoth inflates the archive.
   unzipSync(data,{filter(entry){expanded+=entry.originalSize;if(expanded>20*1024*1024)throw new PublicError('Ce DOCX est trop volumineux une fois décompressé.',413);if(entry.name==='word/document.xml')hasDocument=true;return false;}});
   if(!hasDocument)throw new PublicError('Ce fichier n’est pas un document Word DOCX.');
   const result=await mammoth.extractRawText({arrayBuffer:data.buffer});text=result.value;
  }else throw new PublicError('Format non pris en charge. Choisis un fichier .pdf ou .docx.');
  text=text.trim();if(!text)throw new PublicError('Aucun texte n’a été trouvé. Colle ton CV manuellement.',422);
  if(text.length>40000)throw new PublicError('Le texte dépasse 40 000 caractères. Colle uniquement les éléments du CV utiles à la candidature.',413);
  return json({text});
 }catch(e){return json({error:e instanceof PublicError?e.message:'Impossible de lire ce fichier. Il est peut-être protégé ou endommagé. Colle le texte manuellement.'},e instanceof PublicError?e.status:422);}
}
