import {PARTICIPATION} from './exam-participation.mjs';
import {proposalContext} from './local-key-compare.mjs';
export const tableStructure=exam=>JSON.stringify({className:exam.className,type:exam.type,maxima:exam.key?.map(q=>Number(q.max))||[],questions:exam.questions});
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export async function geminiTableBasis(evaluation){if(!evaluation)return '';const text=JSON.stringify({paper:evaluation.paperFingerprint,key:evaluation.keySignature,reading:evaluation.reading,areas:evaluation.areas});return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,'0')).join('');}
export function validateScoreTables(value,students){
 if(value===undefined)return;
 if(!value||value.version!==1)throw Error('Puan tabloları geçersiz.');
 for(const mode of ['manual','gemini']){const rows=value[mode];if(rows===undefined)continue;if(!rows||typeof rows!=='object'||Array.isArray(rows)||Object.keys(rows).length>250)throw Error('Puan tablosu satırları geçersiz.');for(const [id,r] of Object.entries(rows))if(!students.some(s=>s.id===id)||!r||!Array.isArray(r.scores)||r.scores.length>200||r.scores.some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<0||v>100))||!PARTICIPATION.includes(r.status)||typeof r.checked!=='boolean'||typeof r.structure!=='string'||r.structure.length>5000||typeof r.basis!=='string'||r.basis.length>64)throw Error('Puan tablosundaki kayıt geçersiz.');}
}
export function geminiProposal(exam,id,signature){
 const e=exam.evaluations?.[id];return Array.from({length:exam.questions},(_,i)=>{const r=e?.reading?.[i],a=r?.geminiAreas;if(!e||e.keySignature!==signature||r?.provider!=='gemini'||r.status!=='read'||r.geminiContext!==proposalContext(e,i)||!a?.length||a.some(v=>typeof v.score!=='number'||!Number.isFinite(v.score)||v.score<0||v.score>v.max))return null;const sum=round(a.reduce((n,v)=>n+v.score,0));return sum<=Number(exam.key[i].max)?sum:null;});
}
export function scoreTableRows(exam,students,mode,{papers=new Set(),signature='',bases={},fingerprints}={}){
 const structure=tableStructure(exam);
 return [...students].sort((a,b)=>String(a.number).localeCompare(String(b.number),'tr',{numeric:true})).map(s=>{
  const stored=exam.scoreTables?.[mode]?.[s.id],basis=mode==='gemini'?(bases[s.id]||''):'';
  const sourceInvalid=mode==='gemini'&&fingerprints!==undefined&&(!fingerprints[s.id]||fingerprints[s.id]!==exam.evaluations?.[s.id]?.paperFingerprint);
  const stale=!!stored&&(sourceInvalid||stored.structure!==structure||(mode==='gemini'&&stored.basis!==basis));
  const scores=stored&&!stale?[...stored.scores]:mode==='manual'?Array(exam.questions).fill(null):sourceInvalid?Array(exam.questions).fill(null):geminiProposal(exam,s.id,signature);
  const status=stored?.status||exam.participation?.[s.id]||(mode==='manual'?'Girdi':papers.has(`${exam.id}:${s.id}`)?'Girdi':'Girmedi');
  const effective=status==='Muaf'?scores.map(()=>null):['Girmedi','Kopya'].includes(status)?scores.map(()=>0):scores;
  const complete=effective.length===exam.questions&&(status==='Muaf'||effective.every((n,i)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=Number(exam.key?.[i]?.max)));
  return {...s,scores,effective,status,basis,structure,stale,complete,checked:!!stored?.checked&&!stale&&complete,total:status==='Muaf'||!complete?null:round(effective.reduce((a,b)=>a+b,0))};
 });
}
export function updateScoreTable(exam,mode,row,patch){
 if(!['manual','gemini'].includes(mode))throw Error('Puan tablosu seçimi geçersiz.');
 const record={scores:[...row.scores],status:row.status,basis:row.basis,structure:row.structure,checked:false,...patch};
 return {...exam,scoreTables:{...exam.scoreTables,version:1,[mode]:{...exam.scoreTables?.[mode],[row.id]:record}}};
}
export function compareScoreTables(manual,gemini){return manual.map(m=>{const g=gemini.find(r=>r.id===m.id),comparable=m.status==='Girdi'&&g?.status==='Girdi';const differences=m.effective.map((v,i)=>comparable&&typeof v==='number'&&typeof g.scores[i]==='number'?round(g.scores[i]-v):null);return {...m,gemini:g,geminiTotal:g?.scores.length&&g.scores.every(v=>typeof v==='number')?round(g.scores.reduce((a,b)=>a+b,0)):null,differences,totalDifference:comparable&&m.total!==null&&g.total!==null?round(g.total-m.total):null};});}
export function transferPayload(exam,rows,mode){
 if(!['manual','gemini'].includes(mode))throw Error('Aktarım kaynağı geçersiz.');
 if(!exam.key||exam.key.length!==exam.questions||exam.key.some(q=>!Number.isFinite(Number(q.max))||Number(q.max)<=0))throw Error('Soru üst puanlarını kaydedin.');
 const selected=rows.filter(r=>r.checked);if(!selected.length)throw Error('Önce aktarılacak satırları kontrol edip onaylayın.');
 if(new Set(rows.map(r=>String(r.number).trim())).size!==rows.length)throw Error('Öğrenci numaraları tekrarlanıyor.');
 if(selected.some(r=>!r.complete||!PARTICIPATION.includes(r.status)||r.effective.length!==exam.questions||(r.status==='Muaf'?r.effective.some(v=>v!==null):r.effective.some((v,i)=>typeof v!=='number'||!Number.isFinite(v)||v<0||v>Number(exam.key[i].max)||(['Girmedi','Kopya'].includes(r.status)&&v!==0)))))throw Error('Eksik veya geçersiz puanlı satır aktarılamaz.');
 return {format:'sinav-asistani-eokul',version:1,source:mode,exam:{id:exam.id,name:exam.name,className:exam.className,subject:exam.subject,maxima:exam.key.map(q=>Number(q.max))},students:selected.map(r=>({number:String(r.number),name:r.name,scores:r.effective,total:r.status==='Muaf'?null:round(r.effective.reduce((a,b)=>a+b,0)),participation:{Girdi:'Sınava Girdi',Girmedi:'Sınava Girmedi',Muaf:'Muaf',Kopya:'Kopya'}[r.status]}))};
}
