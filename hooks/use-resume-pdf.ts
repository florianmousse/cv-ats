'use client';
import {useEffect,useState} from 'react';
import type {CV,labels} from '@/lib/cv';
import type {ResumePresentation} from '@/lib/presentation';

export function useResumePDF(cv:CV,headings:typeof labels,design:ResumePresentation){
 const signature=JSON.stringify([cv,headings,design]);
 const [document,setDocument]=useState<{url:string;pages:number;signature:string}|null>(null);
 const [failure,setFailure]=useState(''),[retry,setRetry]=useState(0);
 useEffect(()=>{
  let cancelled=false,url:string|undefined;
  const timer=setTimeout(async()=>{
   try{const {createCVDocument}=await import('@/lib/pdf');const result=await createCVDocument(cv,design.template,headings,design);
    if(cancelled)return;url=URL.createObjectURL(result.blob);setDocument({url,pages:result.pages,signature});setFailure('');
   }catch{if(!cancelled)setFailure(signature);}
  },650);
  return()=>{cancelled=true;clearTimeout(timer);if(url)URL.revokeObjectURL(url);};
 },[cv,headings,design,signature,retry]);
 return {pdf:document?.signature===signature?document:null,failed:failure===signature,refresh:()=>{setFailure('');setRetry(value=>value+1);}};
}
