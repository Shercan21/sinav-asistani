import {hasIdentityRegions,identityFields,readIdentityRegions} from './identity-regions.mjs';
import {matchPageHeader} from './batch-pdf-data.mjs';
export function identityAreasOnPage(regions,page){return identityFields.flatMap(([field,label])=>(regions?.[field]||[]).filter(a=>a.page===page).map(a=>({...a,field,label})))}
export async function identifyPdfStudent({source,group,regions,students,className,readText,signal,createCanvas=()=>document.createElement('canvas')}){
 signal?.throwIfAborted();
 // Explicit teacher selections are authoritative, even when they cannot be read.
 // Never fall back to another part of the page after reading selected regions.
 if(hasIdentityRegions(regions)){const header=await readIdentityRegions(source,group,regions,readText,{signal,createCanvas});return {header,match:matchPageHeader(header,students,className),selected:true}}
 let header=await source.headerText?.(group.start)||'',match=matchPageHeader(header,students,className);
 if(!match.studentId){const c=await source.render(group.start),head=createCanvas();try{head.width=c.width;head.height=Math.max(1,Math.round(c.height*.32));head.getContext('2d').drawImage(c,0,0);header=await readText(head,signal);match=matchPageHeader(header,students,className)}finally{c.width=c.height=head.width=head.height=0}}
 return {header,match,selected:false};
}
