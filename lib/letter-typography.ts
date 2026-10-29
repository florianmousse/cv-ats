/** Repair prose only: keep addresses, URLs, identifiers and compound words intact. */
export function normalizeLetterTypography(text:string){
 return text.replace(/\S+/gu,token=>{
  if(/[@/:\\\d]|www\.|\.[a-z]{2,}(?:\b|$)/iu.test(token))return token;
  return token.replace(/[\u2018\u2019\u02bc]/g,"'").replace(/\u2014/g,'-')
   .replace(/(^|[«("'])([jJlLdDnNmMtTsScC]|[qQ]u|[jJ]usqu|[lL]orsqu|[pP]uisqu|[qQ]uoiqu)-(?=[aàâäeéèêëiîïoôöuùûüyhœæ])/gu,"$1$2'");
 });
}

export const letterTypographyInstructions=`Respecte les apostrophes des élisions françaises : écris "j'ai", "l'entreprise", "d'une équipe", "qu'il", jamais "j-ai", "l-entreprise", "d-une équipe" ou "qu-il". Une apostrophe typographique se remplace par une apostrophe simple ('), jamais par un tiret. Conserve les vrais traits d'union : savoir-faire, peut-être, rendez-vous, ainsi que les noms propres et les liens.`;
