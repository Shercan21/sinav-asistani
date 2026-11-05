import {validateCriterionAlternatives} from './criterion-alternatives.mjs';
import {validateIdentityRegions} from './identity-regions.mjs';
import {validArea} from './assessment-data.mjs';
const idOK=s=>typeof s==='string'&&/^[\w-]{1,100}$/.test(s);
export function keyAnswerAreas(key){
 if(key.answerRegions)return key.answerRegions;
 return key.regions.map((rows,q)=>{const pages=[...new Set(rows.map(a=>a.page))];return pages.map(page=>{const pieces=rows.filter(a=>a.page===page),x=Math.min(...pieces.map(a=>a.x)),y=Math.min(...pieces.map(a=>a.y)),right=Math.max(...pieces.map(a=>a.x+a.width)),bottom=Math.max(...pieces.map(a=>a.y+a.height));return {id:`legacy-answer-${q+1}-${page}`,page,x,y,width:right-x,height:bottom-y}})});
}
export function upgradeRubricKey(key){
 const next=structuredClone(key);next.answerRegions=keyAnswerAreas(next);next.regions=next.regions.map((rows,q)=>rows.map((a,i)=>({...a,label:a.label??`${i+1}. ölçüt`,answerAreaIds:a.answerAreaIds??next.answerRegions[q].map(b=>b.id)})));return next;
}
export function validateRubricLinks(key,count){
 validateIdentityRegions(key.identityRegions);for(const rows of key.regions)for(const c of rows)validateCriterionAlternatives(c.alternatives);
 if(key.regions.some(rows=>rows.some(a=>a.label!==undefined&&(typeof a.label!=='string'||a.label.length>200))))throw new Error('Ölçüt adı geçersiz.');
 if(key.answerRegions===undefined){if(key.regions.some(rows=>rows.some(a=>a.answerAreaIds!==undefined)))throw new Error('Ölçütün cevap alanı tanımı eksik.');return key}
 if(!Array.isArray(key.answerRegions)||key.answerRegions.length!==count)throw new Error('Cevabın aranacağı alanlar geçersiz.');const ids=new Set();
 key.answerRegions.forEach((rows,q)=>{if(!Array.isArray(rows)||rows.length>24)throw new Error('Bir soruda en fazla 24 cevap alanı olabilir.');for(const a of rows){if(!validArea(a)||!idOK(a.id)||ids.has(a.id)||a.label!==undefined&&(typeof a.label!=='string'||a.label.length>200))throw new Error('Cevap alanı geçersiz.');ids.add(a.id)}for(const c of key.regions[q]){if(c.label!==undefined&&(typeof c.label!=='string'||c.label.length>200)||!Array.isArray(c.answerAreaIds)||c.answerAreaIds.length>24||new Set(c.answerAreaIds).size!==c.answerAreaIds.length||c.answerAreaIds.some(id=>!rows.some(a=>a.id===id)))throw new Error('Ölçüt ile cevap alanı bağlantısını kontrol edin.')}});return key;
}
export function linkedRubricReady(key){try{validateRubricLinks(key,key.questions);const areas=keyAnswerAreas(key);return areas.every(rows=>rows.length)&&key.regions.every(rows=>rows.length&&rows.every(a=>a.max>0&&Number.isFinite(a.max)&&(!key.answerRegions||a.answerAreaIds.length>0)))&&Math.abs(key.regions.flat().reduce((n,a)=>n+a.max,0)-100)<.001}catch{return false}}
export function cloneRubricSelections(key,makeId=()=>crypto.randomUUID()){
 const k=upgradeRubricKey(key),map=new Map();k.answerRegions=k.answerRegions.map(rows=>rows.map(a=>{const id=makeId();map.set(a.id,id);return {...a,id}}));k.regions=k.regions.map(rows=>rows.map(a=>({...a,id:makeId(),answerAreaIds:a.answerAreaIds.map(id=>map.get(id))})));return {answerRegions:k.answerRegions,regions:k.regions,...(k.identityRegions?{identityRegions:Object.fromEntries(Object.entries(k.identityRegions).map(([field,rows])=>[field,rows.map(a=>({...a,id:makeId()}))]))}:{})};
}
export function criterionStudentAreas(criterion,areas){const ids=criterion.answerAreaIds||[],matches=areas.filter(a=>ids.includes(a.answerAreaId));return matches.length?matches:areas}
export function criterionRowsForScore(draft,index,score){
 const r=draft.reading?.[index],rows=r?.geminiAreas;if(!rows?.length||r.geminiContext!==JSON.stringify({areas:draft.areas[index],key:draft.keySignature,tone:draft.imageTones?.[index]||'original'})||(draft.marks||[]).some(m=>m.question===index+1&&typeof m.score==='number'))return [];
 const known=rows.filter(a=>a.score!=='');return known.length?score!==''&&Number.isFinite(score)&&Math.abs(known.reduce((n,a)=>n+a.score,0)-Number(score))<.001?rows:[]:score===''?rows:[];
}
export function criteriaForPiece(rows,area,index,areas){return rows.filter(r=>{const matches=areas.filter(a=>(r.answerAreaIds||[]).includes(a.answerAreaId));return matches.length?matches[0].id===area.id:index===0})}

