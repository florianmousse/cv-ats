export class PublicError extends Error { constructor(message:string,public status=400){super(message);} }
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store, max-age=0','Pragma':'no-cache','X-Content-Type-Options':'nosniff'}});}
export async function readLimited(request:Request,limit:number){
  if(Number(request.headers.get('content-length'))>limit)throw new PublicError('Le contenu est trop volumineux.',413);
  const reader=request.body?.getReader();if(!reader)throw new PublicError('Le contenu est vide.');
  const chunks:Uint8Array[]=[];let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new PublicError('Le contenu est trop volumineux.',413);}chunks.push(value);}}finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}return bytes;
}
export function checkOrigin(req:Request){const origin=req.headers.get('origin');const url=new URL(req.url);const host=req.headers.get('host')||url.host;const protocol=req.headers.get('x-forwarded-proto')||url.protocol.slice(0,-1);if(!origin||origin!==`${protocol}://${host}`)throw new PublicError('Cette requête n’est pas autorisée.',403);}
