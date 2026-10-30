import {validScanTemplate} from './scan-data.mjs';
import {omrConfig,customOmrLayout,gradeOmr} from './omr-core.mjs';
const id=v=>typeof v==='string'&&/^[\w-]{1,100}$/.test(v);
const text=(v,max=1000)=>typeof v==='string'&&v.length<=max;
const fail=()=>{throw new Error('Tarama arşivi geçersiz veya bu sürümle uyumlu değil.')};
const array=(v,max)=>Array.isArray(v)&&v.length<=max;
const unique=rows=>new Set(rows.map(r=>r.id)).size===rows.length;
export const emptySerial=()=>({version:1,templates:[],sessions:[]});
const stable=v=>Array.isArray(v)?v.map(stable):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])])):v;
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
export function normalizeOptical(value){
 if(value?.version===2&&Array.isArray(value.sessions))return value;
 if(!value)return {version:2,activeId:'',sessions:[]};
 omrConfig(value.questions,value.choices);
 // A deterministic legacy id lets the same old data migrate again without duplication.
 let hash=2166136261;for(const c of JSON.stringify(stable(value)))hash=Math.imul(hash^c.charCodeAt(0),16777619);
 const session={...value,id:`legacy-optical-${(hash>>>0).toString(16)}`,name:'Önceki optik okuma'};
 return {version:2,activeId:session.id,sessions:[session]};
}
export function validateScanArchive(a){
 if(!a||a.version!==1||!a.serial||a.serial.version!==1||!array(a.serial.templates,1000)||!array(a.serial.sessions,1000)||!unique(a.serial.templates)||!unique(a.serial.sessions)||a.optical?.version!==2||!array(a.optical.sessions,1000)||!unique(a.optical.sessions)||!array(a.images,20000))fail();
 for(const t of a.serial.templates)if(!id(t.id)||!text(t.name,100)||!t.name.trim()||!validScanTemplate(t)||!array(t.anchor?.v,384)||t.anchor.v.length!==384||!t.anchor.v.every(Number.isFinite)||!Number.isFinite(t.anchor.sd))fail();
 const refs=new Set(a.serial.templates.map(t=>t.id));
 for(const s of a.serial.sessions){const template=a.serial.templates.find(t=>t.id===s.templateId);if(!id(s.id)||!id(s.classId)||!template||!text(s.name,200)||!s.name.trim()||!array(s.rows,10000)||!unique(s.rows))fail();for(const r of s.rows){if(!id(r.id)||!text(r.studentId,100)||!r.identity||!Object.values(r.identity).every(v=>text(v))||!array(r.scores,40)||r.scores.length!==template.questions||!r.scores.every(n=>n===''||Number.isFinite(n)&&n>=0&&n<=100)||!(r.paperTotal===''||Number.isFinite(r.paperTotal)&&r.paperTotal>=0&&r.paperTotal<=100)||typeof r.include!=='boolean'||typeof r.reviewed!=='boolean'||!['read','reading','failed','corrected'].includes(r.status)||r.notes!==undefined&&!text(r.notes,30000))fail();if(refs.has(r.id))fail();refs.add(r.id)}}
 for(const s of a.optical.sessions){if(!id(s.id)||!text(s.name,200)||!s.name.trim()||!['generated','custom'].includes(s.mode)||!array(s.results,10000)||!unique(s.results))fail();omrConfig(s.questions,s.choices);if(!array(s.key,100)||s.key.length!==s.questions||s.key.some(k=>k!==''&&!new RegExp(`^[A-${String.fromCharCode(64+s.choices)}]$`).test(k)))fail();if(s.custom){customOmrLayout(s.custom.blocks,s.questions,s.choices);if(!array(s.custom.baseline,s.questions)||s.custom.baseline.length!==s.questions||s.custom.baseline.some(row=>!array(row,s.choices)||row.length!==s.choices||row.some(v=>!Number.isFinite(v)||v<0||v>1)))fail()}
  for(const r of s.results){if(!id(r.id)||!id(r.studentId)||!id(r.classId)||!text(r.studentName)||!text(String(r.number))||!text(r.className)||!array(r.answers,100)||!array(r.key,100)||r.answers.some(v=>!['marked','blank'].includes(v.state)||v.state==='marked'&&!new RegExp(`^[A-${String.fromCharCode(64+r.choices)}]$`).test(v.answer)||v.state==='blank'&&v.answer!==''))fail();omrConfig(r.answers.length,r.choices);const grade=gradeOmr(r.answers,r.key,r.choices);if(['correct','wrong','blank','score','pending'].some(k=>grade[k]!==r[k]))fail()}
 }
 const imageIds=new Set();for(const p of a.images){if(!id(p.id)||imageIds.has(p.id)||!refs.has(p.id)||!text(p.name)||!['image/jpeg','image/png','image/webp'].includes(p.type)||typeof p.base64!=='string'||p.base64.length>20971520||p.base64.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.base64))fail();imageIds.add(p.id)}
 if([...refs].some(k=>!imageIds.has(k)))fail();return a;
}
export function mergeScanArchives(oldValue,newValue){
 if(!oldValue)return newValue;if(!newValue)return oldValue;validateScanArchive(oldValue);validateScanArchive(newValue);
 const merge=(a,b)=>{const rows=[...a];for(const row of b){const previous=rows.find(r=>r.id===row.id);if(previous&&!same(previous,row))throw new Error('Aynı taramanın farklı kayıtları var. Hiçbir tarama değiştirilmedi.');if(!previous)rows.push(row)}return rows};
 return validateScanArchive({version:1,serial:{version:1,templates:merge(oldValue.serial.templates,newValue.serial.templates),sessions:merge(oldValue.serial.sessions,newValue.serial.sessions)},optical:{version:2,activeId:oldValue.optical.activeId||newValue.optical.activeId,sessions:merge(oldValue.optical.sessions,newValue.optical.sessions)},images:merge(oldValue.images,newValue.images)});
}
export const archiveHasData=a=>!!(a?.serial?.templates?.length||a?.serial?.sessions?.length||a?.optical?.sessions?.length);
