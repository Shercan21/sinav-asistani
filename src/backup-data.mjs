import {validateMarks} from './paper-marks.mjs';
import {validateKey, gradeExam} from './exam-data.mjs';
import {normalizeReading} from './ocr-data.mjs';
const idOK=value=>typeof value==='string'&&/^[\w-]{1,100}$/.test(value);
const textOK=value=>typeof value==='string'&&value.trim().length>0&&value.length<=1000;
const fail=()=>{throw new Error('Yedek dosyasının içeriği geçersiz veya bu sürümle uyumlu değil.')};
export function validateBackup(data) {
  if(data?.format!=='sinav-asistani'||data.version!==1||!Array.isArray(data.classes)||!Array.isArray(data.exams)||!Array.isArray(data.papers)||data.classes.length>250||data.exams.length>10000)fail();
  const classIds=new Set(),names=new Set(),studentIds=new Set(),examIds=new Set();
  for(const c of data.classes){
    const normalized=typeof c.name==='string'?c.name.trim().toLocaleLowerCase('tr'):'';
    if(!idOK(c.id)||classIds.has(c.id)||!textOK(c.name)||names.has(normalized)||!Number.isInteger(c.count)||c.count<0||c.count>250||!Array.isArray(c.students??[])||(c.students||[]).length>c.count)fail();
    classIds.add(c.id);names.add(normalized);const numbers=new Set();
    for(const s of c.students||[]){if(!idOK(s.id)||studentIds.has(s.id)||!textOK(s.number)||!textOK(s.name)||numbers.has(s.number))fail();studentIds.add(s.id);numbers.add(s.number)}
  }
  if(data.classes.reduce((sum,c)=>sum+c.count,0)>250)fail();
  for(const exam of data.exams){
    const classroom=data.classes.find(c=>c.name===exam.className);
    if(!idOK(exam.id)||examIds.has(exam.id)||!textOK(exam.name)||!textOK(exam.subject)||!classroom||!['Test','Klasik','Karma'].includes(exam.type)||!Number.isInteger(exam.questions)||exam.questions<1||exam.questions>200)fail();
    examIds.add(exam.id);
    if(exam.key!==undefined&&(!Array.isArray(exam.key)||!validateKey(exam.key,exam.questions,exam.type)))fail();
    if(exam.paperMarks!==undefined){
      if(!exam.paperMarks||typeof exam.paperMarks!=='object'||Array.isArray(exam.paperMarks))fail();
      for(const [studentId,marks] of Object.entries(exam.paperMarks)){
        if(!(classroom.students||[]).some(s=>s.id===studentId))fail();validateMarks(marks);
      }
    }
    if(exam.readings!==undefined){
      if(!exam.readings||typeof exam.readings!=='object'||Array.isArray(exam.readings))fail();
      for(const [studentId,saved] of Object.entries(exam.readings)){
        if(!(classroom.students||[]).some(s=>s.id===studentId)||!saved||!/^[a-f0-9]{64}$/.test(saved.paperFingerprint)||typeof saved.reviewed!=='boolean')fail();
        normalizeReading(saved.reading,exam.questions);
      }
    }
    if(exam.results!==undefined){
      if(!exam.results||typeof exam.results!=='object'||Array.isArray(exam.results))fail();
      for(const [studentId,values] of Object.entries(exam.results)){if(!(classroom.students||[]).some(s=>s.id===studentId)||!Array.isArray(values)||gradeExam(exam,values)===null)fail()}
    }
  }
  const paperIds=new Set();
  for(const p of data.papers){
    const [examId,studentId,...rest]=typeof p.id==='string'?p.id.split(':'):[];
    const exam=data.exams.find(e=>e.id===examId), classroom=data.classes.find(c=>c.name===exam?.className);
    if(rest.length||!exam||!(classroom.students||[]).some(s=>s.id===studentId)||paperIds.has(p.id)||!textOK(p.name)||!['image/jpeg','image/png','image/webp','application/pdf'].includes(p.type)||typeof p.base64!=='string'||p.base64.length>20971520||p.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.base64))fail();
    paperIds.add(p.id);
  }
  return data;
}
const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
const same=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
export function mergeBackup(current,incoming){
  validateBackup(current);validateBackup(incoming);
  const merge=(oldRows,newRows,label)=>{
    const result=[...oldRows];
    for(const item of newRows){const previous=oldRows.find(row=>row.id===item.id);if(previous&&!same(previous,item))throw new Error(`${label} mevcut kayıttan farklı. Güvenlik için hiçbir kayıt değiştirilmedi. Yedeği boş bir tarayıcıda açabilirsiniz.`);if(!previous)result.push(item)}
    return result;
  };
  const merged={...current,classes:merge(current.classes,incoming.classes,'Sınıf'),exams:merge(current.exams,incoming.exams,'Sınav'),papers:merge(current.papers,incoming.papers,'Sınav kâğıdı')};
  validateBackup(merged);return merged;
}
