import {validArea} from './assessment-data.mjs';
export const identityFields=[['name','Ad soyad'],['number','Öğrenci numarası'],['className','Sınıf']];
export function validateIdentityRegions(value){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!identityFields.some(([f])=>f===k)))throw new Error('Öğrenci bilgi alanları geçersiz.');
 const ids=new Set();for(const [field] of identityFields){const rows=value[field]||[];if(!Array.isArray(rows)||rows.length>4)throw new Error('Her öğrenci bilgisi için en fazla 4 alan seçin.');for(const a of rows){if(!validArea(a)||typeof a.id!=='string'||! /^[\w-]{1,100}$/.test(a.id)||ids.has(a.id))throw new Error('Öğrenci bilgi alanını kontrol edin.');ids.add(a.id)}}
}
export const hasIdentityRegions=value=>identityFields.some(([field])=>value?.[field]?.length);
// Template page numbers are relative to each student's first page in the class PDF.
export async function readIdentityRegions(source,group,regions,readText,{signal,createCanvas=()=>document.createElement('canvas')}={}){
 validateIdentityRegions(regions);const values={};
 for(const [field] of identityFields){const texts=[];for(const area of regions?.[field]||[]){signal?.throwIfAborted();const page=group.start+area.page-1;if(page>group.end)throw new Error('Öğrenci bilgi alanı bu öğrencinin sayfa grubunun dışında. Sayfa ayrımını kontrol edin.');const original=await source.render(page),crop=createCanvas();try{crop.width=Math.max(1,Math.round(original.width*area.width));crop.height=Math.max(1,Math.round(original.height*area.height));crop.getContext('2d').drawImage(original,original.width*area.x,original.height*area.y,original.width*area.width,original.height*area.height,0,0,crop.width,crop.height);texts.push(await readText(crop,signal))}finally{original.width=original.height=crop.width=crop.height=0}}values[field]=texts.join(' ').trim()}
 return identityFields.filter(([f])=>values[f]).map(([f,label])=>`${label}: ${values[f]}`).join('\n');
}
