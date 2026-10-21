import {validArea} from './assessment-data.mjs';
import {validateMarks} from './paper-marks.mjs';
const hashOK=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
const idOK=s=>typeof s==='string'&&/^[\w-]{1,100}$/.test(s);
export const roundScore=n=>Math.round((n+Number.EPSILON)*100)/100;
export function pointValue(text){
 const s=String(text).trim();if(!/^\d+(?:[.,]\d{1,2})?$/.test(s))return null;
 const n=Number(s.replace(',','.'));return Number.isFinite(n)&&n>=0&&n<=100?n:null;
}
export function moveArea(a,mode,dx,dy){
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 if(mode==='move')return {...a,x:clamp(a.x+dx,0,1-a.width),y:clamp(a.y+dy,0,1-a.height)};
 let l=a.x,r=a.x+a.width,t=a.y,b=a.y+a.height;
 if(mode.includes('w'))l=clamp(l+dx,0,r-.01);if(mode.includes('e'))r=clamp(r+dx,l+.01,1);
 if(mode.includes('n'))t=clamp(t+dy,0,b-.01);if(mode.includes('s'))b=clamp(b+dy,t+.01,1);
 return {...a,x:l,y:t,width:r-l,height:b-t};
}
export function validateAreaRows(rows,count,scored=false){
 if(!Array.isArray(rows)||rows.length!==count)throw new Error('Soru alanları geçersiz.');
 const ids=new Set();for(const group of rows){if(!Array.isArray(group)||group.length>24)throw new Error('Bir soruda en fazla 24 alan olabilir.');for(const a of group){if(!validArea(a)||!idOK(a.id)||ids.has(a.id))throw new Error('Seçili alan geçersiz.');ids.add(a.id);if(scored&&(a.max!==''&&(typeof a.max!=='number'||!Number.isFinite(a.max)||a.max<0||a.max>100)))throw new Error('Alan puanı 0–100 arasında olmalı.')}}return rows;
}
export function rubricScores(rows){return rows.map(group=>roundScore(group.reduce((n,a)=>n+Number(a.max||0),0)))}
export function validVisualRubric(regions){return regions.every(group=>group.length&&group.every(a=>typeof a.max==='number'&&a.max>0))&&Math.abs(rubricScores(regions).reduce((a,b)=>a+b,0)-100)<.001}
export function validateVisualKey(key,count){
 if(!key||!idOK(key.id)||typeof key.name!=='string'||!key.name.trim()||key.name.length>200||!hashOK(key.paperFingerprint)||typeof key.paperId!=='string'||key.paperId.length>250||key.questions!==count)throw new Error('Görsel cevap anahtarı geçersiz.');
 validateAreaRows(key.regions,count,true);return key;
}
export function validateEvaluation(value,count){
 if(!value||value.version!==1||!hashOK(value.paperFingerprint)||!hashOK(value.keySignature)||!Array.isArray(value.checked)||value.checked.length!==count||value.checked.some(v=>typeof v!=='boolean')||!Array.isArray(value.manualScores)||value.manualScores.length!==count||value.manualScores.some(v=>v!==''&&(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)))throw new Error('Değerlendirme taslağı geçersiz.');
 validateAreaRows(value.areas,count);validateMarks({paperFingerprint:value.paperFingerprint,items:value.marks});
 const ids=new Set();for(const m of value.marks){if(!Number.isInteger(m.question)||m.question<1||m.question>count||m.page>12||ids.has(m.id))throw new Error('Puan işareti geçersiz.');ids.add(m.id);if(m.score!==undefined&&(m.kind!=='text'||pointValue(m.text)!==m.score))throw new Error('Puan yazısı ve değeri uyuşmuyor.');}
 if(!Array.isArray(value.reading)||value.reading.length!==count||value.reading.some(r=>!r||typeof r.text!=='string'||r.text.length>10000||!['unread','read','failed'].includes(r.status)))throw new Error('OCR taslağı geçersiz.');
 return value;
}
export function evaluationScores(draft){return draft.manualScores.map((fallback,i)=>{const rows=draft.marks.filter(m=>m.question===i+1&&typeof m.score==='number');return rows.length?roundScore(rows.reduce((n,m)=>n+m.score,0)):fallback})}
export function freshEvaluation(fingerprint,keySignature,count,previous,savedReading,results=[]){
 if(previous?.paperFingerprint===fingerprint){try{const restored=structuredClone(validateEvaluation(previous,count));if(restored.keySignature!==keySignature){restored.checked=Array(count).fill(false);restored.keySignature=keySignature}return restored}catch{}}
 const legacy=savedReading?.paperFingerprint===fingerprint?savedReading.workflow:null;
 return {version:1,paperFingerprint:fingerprint,keySignature,areas:Array.from({length:count},(_,i)=>(legacy?.areas?.[i]||[]).map(a=>({...a,id:crypto.randomUUID()}))),marks:[],manualScores:Array.from({length:count},(_,i)=>legacy?.scores?.[i]!==undefined&&legacy.scores[i]!==''?Number(legacy.scores[i]):results[i]!==undefined&&results[i]!==''&&Number.isFinite(Number(results[i]))?Number(results[i]):''),checked:Array(count).fill(false),reading:Array.from({length:count},(_,i)=>({text:savedReading?.paperFingerprint===fingerprint?(savedReading.reading?.answers?.[i]?.text||''):'',status:'unread'}))};
}
export async function visualSignature(key,visual){const bytes=new TextEncoder().encode(JSON.stringify({maxima:key.map(k=>Number(k.max)),visual}));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')}
export function annotationInArea(m,a){const p=m.kind==='pen'?m.points[0]:m;return m.page===a.page&&p.x>=a.x&&p.x<=a.x+a.width&&p.y>=a.y&&p.y<=a.y+a.height}
