import {z} from 'zod';

export const documentFactsSchema=z.discriminatedUnion('format',[
 z.object({format:z.literal('pdf'),pages:z.number().int().min(1).max(25),charactersPerPage:z.array(z.number().int().min(0).max(10_000_000)).min(1).max(25)}).strict(),
 z.object({format:z.literal('docx')}).strict(),
]);
export type DocumentFacts=z.infer<typeof documentFactsSchema>;
