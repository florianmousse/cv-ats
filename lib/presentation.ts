import {z} from 'zod';

export const presentationSchema=z.object({
 template:z.enum(['modern','finance','minimal']),
 accent:z.enum(['#266c53','#1f3a5f','#614b75','#333333']),
 density:z.enum(['comfortable','compact']),
}).strict();
export type ResumePresentation=z.infer<typeof presentationSchema>;
export const defaultPresentation:ResumePresentation={template:'modern',accent:'#266c53',density:'comfortable'};
export const templates=[
 {id:'modern',name:'Essentiel',description:'Net, contemporain, facile à parcourir.'},
 {id:'finance',name:'Classique',description:'Typographie à empattements, titre centré.'},
 {id:'minimal',name:'Éditorial',description:'Des titres discrets et plus de respiration.'},
] as const;
