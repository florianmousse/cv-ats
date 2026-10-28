'use client';
import {useId,type ReactNode} from 'react';
import {ArrowDown,ArrowUp,Trash2} from 'lucide-react';

export function Field({label,value,onChange,multiline=false}:{label:string;value:string;onChange:(value:string)=>void;multiline?:boolean}){
 const id=useId();return <div className="resume-field"><label htmlFor={id}>{label}</label>{multiline?<textarea id={id} rows={5} maxLength={12000} value={value} onChange={e=>onChange(e.target.value)}/>:<input id={id} maxLength={12000} value={value} onChange={e=>onChange(e.target.value)}/>}</div>;
}
export function EditorSection({title,children,open=false}:{title:string;children:ReactNode;open?:boolean}){return <details className="editor-section" open={open}><summary>{title}</summary><div>{children}</div></details>;}
export function EntryActions({label,index,count,move,remove}:{label:string;index:number;count:number;move:(direction:-1|1)=>void;remove:()=>void}){return <div className="entry-actions"><strong>{label}</strong><button className="icon-action" aria-label={`Monter ${label.toLowerCase()}`} disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={14}/></button><button className="icon-action" aria-label={`Descendre ${label.toLowerCase()}`} disabled={index===count-1} onClick={()=>move(1)}><ArrowDown size={14}/></button><button className="icon-action" aria-label={`Supprimer ${label.toLowerCase()}`} onClick={remove}><Trash2 size={14}/></button></div>;}
