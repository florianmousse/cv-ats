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

export const scoreDimensions={structure:'Structure et lisibilité',impact:'Impact et preuves',ats:'Lisibilité technique du texte',clarte:'Clarté et concision',completude:'Complétude utile'} as const;
export const dimensionSchema=z.enum(['structure','impact','ats','clarte','completude']);
export type ScoreDimension=z.infer<typeof dimensionSchema>;
export const mechanicalIds=['text_layer','page_count','email','phone','experience_section','education_section','skills_section','chronology','date_ranges','spaced_letters','encoding','sentence_length','repeated_lines','project_details'] as const;
export const mechanicalCheckSchema=z.object({id:z.enum(mechanicalIds),label:z.string(),status:z.enum(['ok','attention','inconnu']),detail:z.string(),extrait:z.string().optional()}).strict();
export type MechanicalCheck=z.infer<typeof mechanicalCheckSchema>;
const points=z.number().int().min(0).max(20);
export const scoreDetailsSchema=z.object({method:z.literal('cvats-2'),dimensions:z.object({structure:points,impact:points,ats:points,clarte:points,completude:points}).strict(),qualitativeComplete:z.boolean(),rejectedSuggestions:z.number().int().nonnegative()}).strict();
