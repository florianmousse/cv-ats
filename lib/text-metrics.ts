export function countWords(source:string){return (source.match(/[\p{L}\p{N}]+(?:[’'./+#-][\p{L}\p{N}]+)*/gu)??[]).length;}

/** Conservative segmentation of experience text, joining extraction-induced line wraps. */
export function experiencePhrases(source:string){
 const lines=source.split(/\r?\n/).map(line=>line.trim()).filter(Boolean);
 const start=lines.findIndex(line=>/^(?:expériences?|experiences?)(?:\s+professionnelles?)?\s*:?$/i.test(line));
 if(start<0)return [];
 const end=lines.findIndex((line,i)=>i>start&&/^(?:formations?|compétences|competences|langues|qualités|qualites|projets personnels|centres d.intérêts?)\s*:?$/i.test(line));
 const section=lines.slice(start+1,end<0?undefined:end);
 const begins=/^(?:[-•–]\s*)?(?:conception|développement|developpement|corrections?|mise à jour|contacts?|compréhension|programmation|gestion|participation|réalisation|maintenance|intégration|analyse|rédaction|création|concevoir|développer|corriger|maintenir|intégrer|analyser|rédiger|créer|piloter|accompagner|assurer|gérer|automatiser|tester|optimiser|coordonner|mettre|réaliser)\b/i;
 const phrases:string[]=[];
 let current='';
 const flush=()=>{if(current)phrases.push(current);current='';};
 for(const line of section){
  if(begins.test(line)){flush();current=line;}
  else if(current&&!/^\p{Lu}[\p{Lu}\s’'—-]+$/u.test(line)&&!/(?:\b(?:19|20)\d{2}\b|\|)/.test(line)){current+='\n'+line;}
  else flush();
 }
 flush();return phrases;
}

