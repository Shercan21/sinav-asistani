import {scoreTableRows,updateScoreTable,validateScoreTables,tableStructure} from './score-transfer.mjs';
export function validateScoreSheets(value,students){
 if(value===undefined)return;
 if(!value||value.version!==1||!Array.isArray(value.tables)||value.tables.length>50)throw Error('Puan listeleri geçersiz.');
 const ids=new Set();for(const t of value.tables){if(!t||!t.rows||typeof t.id!=='string'||!t.id||ids.has(t.id)||(t.deleted!==undefined&&typeof t.deleted!=='boolean')||typeof t.name!=='string'||!t.name.trim()||t.name.length>120)throw Error('Puan listesi adı geçersiz.');ids.add(t.id);validateScoreTables({version:1,manual:t.rows},students);}
}
export function saveScoreSheet(exam,sheet){return {...exam,scoreSheets:{...exam.scoreSheets,version:1,tables:[...(exam.scoreSheets?.tables||[]).filter(t=>t.id!==sheet.id),sheet]}};}
export function sourceRows(exam,students){let next={...exam,scoreTables:{}};for(const row of scoreTableRows({...exam,scoreTables:{}},students,'gemini'))next=updateScoreTable(next,'manual',row,{checked:false});return next.scoreTables?.manual||{};}
export function compareSheets(exam,students,left,right){
 const rows=t=>scoreTableRows({...exam,scoreTables:{manual:t.rows}},students,'manual');const a=rows(left),b=rows(right);
 return a.map(r=>{const other=b.find(v=>v.id===r.id),compatible=left.rows?.[r.id]?.structure===tableStructure(exam)&&right.rows?.[r.id]?.structure===tableStructure(exam)&&r.status===other.status;return {...r,other,differences:r.effective.map((v,i)=>compatible&&typeof v==='number'&&typeof other.effective[i]==='number'?Math.round((other.effective[i]-v)*100)/100:null)};});
}
