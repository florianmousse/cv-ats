import { z } from 'zod';
import { cvSchema, labels, headingsSchema } from '@/lib/cv';
import {presentationSchema,type ResumePresentation} from '@/lib/presentation';
export const optimizedSchema = z.object({ kind: z.literal('optimize'), data: cvSchema, headings: headingsSchema,presentation:presentationSchema.optional() }).strict();
export type OptimizedResult = { kind: 'optimize'; data: z.infer<typeof cvSchema>; headings: typeof labels;presentation?:ResumePresentation };
export const saveSchema = z.object({ name:z.string().trim().min(1).max(100), cv:z.string().trim().min(30).max(40000), job:z.string().max(30000).default(''), result:optimizedSchema.nullable().default(null) }).strict();
export type SavedCV = { id:string; name:string; created_at:string; cv:string; job:string; result:OptimizedResult|null };
export type SavedSummary = Pick<SavedCV,'id'|'name'|'created_at'>;
