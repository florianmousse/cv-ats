export type LinkPart={text:string;url?:string};
/** Only web links and email addresses; never active file/script/data URLs. */
export function safeResumeURL(value:string):string|undefined{
 const text=value.trim();if(!text||/[\s<>]/.test(text))return;
 if(/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(text))return `mailto:${text}`;
 const candidate=/^https?:\/\//i.test(text)?text:/^(?:[a-z0-9-]+\.)+[a-z]{2,}(?:[/?#]|$)/i.test(text)?`https://${text}`:undefined;
 if(!candidate)return;
 try{const url=new URL(candidate);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return;return url.href;}catch{return;}
}
export function resumeLinkParts(text:string,knownLinks:string[]=[]):LinkPart[]{
 const pattern=/(?:https?:\/\/[^\s<>]+|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>]*)?)/gi;
 const parts:LinkPart[]=[];let cursor=0;
 for(const match of text.matchAll(pattern)){
  const start=match.index,raw=match[0].replace(/[.,;!?)\]}]+$/,'');
  if(start>0&&/[\w@:/\\]/.test(text[start-1]))continue;
  if(!/^https?:\/\/|^www\.|@/i.test(raw)&&!knownLinks.includes(raw))continue;
  const url=safeResumeURL(raw);if(!url)continue;
  if(start>cursor)parts.push({text:text.slice(cursor,start)});
  parts.push({text:raw,url});cursor=start+raw.length;
 }
 if(cursor<text.length)parts.push({text:text.slice(cursor)});
 return parts.length?parts:[{text}];
}
