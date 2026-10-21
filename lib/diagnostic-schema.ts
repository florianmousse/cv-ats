import {z} from 'zod';

export const diagnosticCategories={
 orthographe:'Orthographe et grammaire',typographie:'Typographie du texte',densite:'Volume et précision',
 formulations:'Phrases d’expérience',realisations:'Réalisations et preuves',structure:'Rubriques et titre',
 chronologie:'Dates et cohérence',competences:'Compétences et outils',adequation:'Adéquation à l’offre',clarte:'Clarté et répétitions',
} as const;
export const categorySchema=z.enum(['orthographe','typographie','densite','formulations','realisations','structure','chronologie','competences','adequation','clarte']);
export const requirementCategories={technique:'Technologies et outils',version:'Versions',experience:'Expérience demandée',mission:'Missions',qualite:'Qualités',langue:'Langues',contexte:'Contexte'} as const;
export const requirementSchema=z.object({
 terme:z.string().min(1).max(200),categorie:z.enum(['technique','version','experience','mission','qualite','langue','contexte']),
 extraitAnnonce:z.string().min(1).max(1800),preuveCV:z.string().max(1800).default(''),
 statut:z.enum(['mentionne','a_preciser','non_documente']),conseil:z.string().max(2000),origine:z.enum(['local','ia']).optional(),
}).strict();
export const checkSchema=z.object({categorie:categorySchema,statut:z.enum(['ok','a_corriger','a_verifier','non_evalue']),constat:z.string().max(2000)}).strict();
export type Requirement=z.infer<typeof requirementSchema>;
export type DiagnosticCategory=z.infer<typeof categorySchema>;
