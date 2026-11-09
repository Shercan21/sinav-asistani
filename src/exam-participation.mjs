import {gradeExam,validateKey} from './exam-data.mjs';
export const PARTICIPATION=['Girdi','Girmedi','Muaf','Kopya'];
export function validateParticipation(value,students){
 if(value===undefined)return;
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.entries(value).some(([id,status])=>!students.some(s=>s.id===id)||!PARTICIPATION.includes(status)))throw Error('Sınava katılım kayıtları geçersiz.');
}
export function participationRows(exam,students,paperIds){
 validateParticipation(exam.participation,students);
 return [...students].sort((a,b)=>String(a.number).localeCompare(String(b.number),'tr',{numeric:true})).map(student=>{
  const hasPaper=paperIds.has(`${exam.id}:${student.id}`),override=exam.participation?.[student.id],status=override||(hasPaper?'Girdi':'Girmedi');
  const values=exam.results?.[student.id],saved=Array.isArray(values)&&gradeExam(exam,values)!==null;
  const testChoices=saved&&exam.type==='Test'&&(!exam.visualRubric||values.every(v=>/^[A-E-]$/.test(v)));
  const original=saved?values.map((v,i)=>testChoices?(v===exam.key[i].answer?Number(exam.key[i].max):0):Number(v)):Array(exam.questions).fill(null);
  const scores=status==='Muaf'?Array(exam.questions).fill(null):['Girmedi','Kopya'].includes(status)?Array(exam.questions).fill(0):original;
  return {...student,hasPaper,status,automatic:!override,saved,scores,total:scores.every(v=>v!==null)?Math.round(scores.reduce((a,b)=>a+b,0)*100)/100:null};
 });
}
export function participationExportIssues(exam,rows){
 const issues=[];if(!validateKey(exam.key||[],exam.questions,exam.type))issues.push('Önce cevap anahtarını ve soru puanlarını kaydedin.');
 if(!rows.length)issues.push('Sınıfın öğrenci listesi boş.');
 if(new Set(rows.map(r=>r.number)).size!==rows.length)issues.push('Öğrenci numaraları tekrar ediyor.');
 for(const row of rows){if(!PARTICIPATION.includes(row.status)||row.scores.length!==exam.questions)issues.push(`${row.number}: Katılım veya soru bilgisi geçersiz.`);else if(row.status==='Girdi'&&(!row.saved||row.scores.some((v,i)=>!Number.isFinite(v)||v<0||v>Number(exam.key?.[i]?.max))))issues.push(`${row.number}: Girdi seçili; bütün soru puanları henüz kaydedilmemiş.`);}
 return issues;
}
