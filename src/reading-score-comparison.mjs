import {proposalContext} from './local-key-compare.mjs';
const round=n=>Math.round((n+Number.EPSILON)*100)/100;
export function compareReadingScores(draft,key,saved){
 const valid=(n,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
 const rows=key.map((k,i)=>{
  const max=Number(k.max),reference=valid(saved?.[i],max)?saved[i]:null,reading=draft.reading?.[i],areas=reading?.geminiAreas;
  const current=reading?.geminiContext===proposalContext(draft,i);
  const complete=current&&reading.status==='read'&&Array.isArray(areas)&&areas.length>0&&areas.every(r=>valid(r.score,r.max));
  const sum=complete?round(areas.reduce((n,r)=>n+r.score,0)):null,proposed=sum!==null&&sum<=max?sum:null;
  return {question:i+1,saved:reference,proposed,difference:reference!==null&&proposed!==null?round(proposed-reference):null};
 });
 const compared=rows.filter(r=>r.difference!==null);
 return {rows,compared:compared.length,averageDifference:compared.length?round(compared.reduce((n,r)=>n+Math.abs(r.difference),0)/compared.length):null};
}
