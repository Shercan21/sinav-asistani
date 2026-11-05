import {hasIdentityRegions,identityFields,readIdentityRegions} from './identity-regions.mjs';
import {matchPageHeader} from './batch-pdf-data.mjs';
export function identityAreasOnPage(regions,page){return identityFields.flatMap(([field,label])=>(regions?.[field]||[]).filter(a=>a.page===page).map(a=>({...a,field,label})))}
export async function identifyPdfStudent({source,group,regions,fallbackRegions,students,className,readText,signal,createCanvas=()=>document.createElement('canvas')}){
 signal?.throwIfAborted();
 // Explicit teacher selections are authoritative, even when they cannot be read.
 // Never fall back to another part of the page after reading selected regions.
 if(hasIdentityRegions(regions)){let header=await readIdentityRegions(source,group,regions,readText,{signal,createCanvas}),match=matchPageHeader(header,students,className),regionsUsed=regions;
  if(!match.studentId&&fallbackRegions&&JSON.stringify(fallbackRegions)!==JSON.stringify(regions)){const original=await readIdentityRegions(source,group,fallbackRegions,readText,{signal,createCanvas}),previous=matchPageHeader(original,students,className);if(previous.studentId){header=original;match=previous;regionsUsed=fallbackRegions}}
  return {header,match,selected:true,regionsUsed};}
 let header=await source.headerText?.(group.start)||'',match=matchPageHeader(header,students,className);
 if(!match.studentId){const c=await source.render(group.start),head=createCanvas();try{head.width=c.width;head.height=Math.max(1,Math.round(c.height*.32));head.getContext('2d').drawImage(c,0,0);header=await readText(head,signal);match=matchPageHeader(header,students,className)}finally{c.width=c.height=head.width=head.height=0}}
 return {header,match,selected:false};
}
