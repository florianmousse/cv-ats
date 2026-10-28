import {z} from 'zod';

// Draft fields may be incomplete while editing. Validation is stricter before generation.
export const companyResearchSchema=z.object({
 company:z.string().trim().max(200).default(''),
 excerpt:z.string().trim().max(3000).default(''),
 url:z.string().trim().max(1500).default(''),
 date:z.string().trim().max(10).default(''),
}).strict();
export type CompanyResearch=z.infer<typeof companyResearchSchema>;
export const emptyCompanyResearch=():CompanyResearch=>({company:'',excerpt:'',url:'',date:''});
export function researchError(value:CompanyResearch):string|null{
 if(!value.excerpt&&!value.url&&!value.date)return null;
 if(!value.company)return 'Indique le nom de l\'entreprise concernée par cette actualité.';
 if(!value.excerpt)return 'Colle le passage pertinent de l\'article : une URL seule ne permet pas de le lire.';
 try{const url=new URL(value.url);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error();}catch{return 'Ajoute un lien HTTP ou HTTPS vers la source de cette actualité.';}
 if(value.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||Number.isNaN(Date.parse(value.date))||new Date(value.date).toISOString().slice(0,10)!==value.date))return 'Indique une date de publication valide, ou laisse-la vide si elle est inconnue.';
 return null;
}
export const validatedCompanyResearchSchema=companyResearchSchema.superRefine((value,ctx)=>{const error=researchError(value);if(error)ctx.addIssue({code:z.ZodIssueCode.custom,message:error});});
export function companySearchURL(company:string){return `https://www.google.com/search?q=${encodeURIComponent(company.trim()+' actualités communiqué site officiel')}`;}
