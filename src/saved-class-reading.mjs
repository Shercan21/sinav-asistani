import {gradeExam} from './exam-data.mjs';
import {freshEvaluation,visualSignature,evaluationScores} from './visual-assessment.mjs';
import {bulkReadingDraft} from './batch-pdf-reading.mjs';
import {runPdfQueue} from './batch-pdf-data.mjs';
export function hasCurrentSavedReading(draft,hash,signature,count){return draft?.paperFingerprint===hash&&draft.keySignature===signature&&draft.reading?.length===count&&draft.areas?.length===count&&draft.reading.every(r=>r.provider==='gemini'&&r.geminiAreas?.length)}
export async function discoverSavedClassPapers({exam,students,readPaper,fingerprint,guard=()=>{},signal}){
 const signature=await visualSignature(exam.key,exam.visualRubric),rows=[];
 for(const student of students){signal?.throwIfAborted();guard();const paper=await readPaper(`${exam.id}:${student.id}`);signal?.throwIfAborted();guard();if(!paper){rows.push({...student,available:false});continue}const hash=await fingerprint(paper);signal?.throwIfAborted();guard();rows.push({...student,available:true,hash,filename:paper.name,size:paper.size,hasReading:!!hasCurrentSavedReading(exam.evaluations?.[student.id],hash,signature,exam.questions)})}return rows;
}
export async function readSavedClassPapers({items,exam,getCurrent,readPaper,fingerprint,read,save,guard=()=>{},signal,onProgress,onDone,pauseMs=5500}){
 const original=structuredClone(exam),signature=await visualSignature(original.key,original.visualRubric),keyId=original.visualRubric?.paperId||`${original.id}:__answer_key__`;
 const check=async sid=>{signal?.throwIfAborted();guard();const current=getCurrent();if(current.exam.id!==original.id||await visualSignature(current.exam.key,current.exam.visualRubric)!==signature)throw new Error('Cevap anahtarı değişti; kalan okumalar durduruldu.');if(sid&&!current.students.some(s=>s.id===sid))throw new Error('Sınıf listesi değişti; kalan okumalar durduruldu.');signal?.throwIfAborted();guard()};
 await check();const keyPaper=await readPaper(keyId);await check();if(!keyPaper)throw new Error('Kayıtlı cevap anahtarı dosyası bulunamadı.');const keyHash=await fingerprint(keyPaper);if(original.visualRubric?.paperFingerprint&&original.visualRubric.paperFingerprint!==keyHash)throw new Error('Anahtar dosyası değişmiş; cevap anahtarını kontrol edip kaydedin.');
 return runPdfQueue(items,async row=>{await check(row.id);const before=JSON.stringify(getCurrent().exam.evaluations?.[row.id]||null),paperId=`${original.id}:${row.id}`,paper=await readPaper(paperId);await check(row.id);if(!paper||await fingerprint(paper)!==row.hash)throw new Error(`${row.number}: Kâğıt değişmiş; listeyi yenileyin.`);
  const draft=freshEvaluation(row.hash,signature,original.questions),result=await read({paper,keyPaper,questions:original.questions,answerKey:original.key,visualRubric:original.visualRubric,targets:Array.from({length:original.questions},(_,i)=>i+1),areas:draft.areas,signal,onProgress});await check(row.id);
  const currentPaper=await readPaper(paperId),currentKey=await readPaper(keyId);await check(row.id);if(!currentPaper||await fingerprint(currentPaper)!==row.hash||!currentKey||await fingerprint(currentKey)!==keyHash)throw new Error('Okuma sırasında kâğıt değişti; öneri kaydedilmedi.');if(JSON.stringify(getCurrent().exam.evaluations?.[row.id]||null)!==before)throw new Error('Bu öğrencinin çalışması başka bir ekranda değişti; mevcut çalışma korundu.');await check(row.id);await save(row.id,bulkReadingDraft(draft,result));onDone?.(row);
 },{signal,pauseMs,onProgress:(i,n,row)=>onProgress?.(`${i+1}/${n} · ${row.number} ${row.name}: bütün sorular okunuyor…`)});
}

export function savedPaperReviewStatus(exam,row,completed=false){
 const values=exam.results?.[row.id],draft=exam.evaluations?.[row.id];
 const saved=Array.isArray(values)&&gradeExam(exam,values)!==null;
 if(saved){
  if(!draft)return 'Onaylandı · puanlar kaydedildi';
  const scores=evaluationScores(draft);
  if(draft.paperFingerprint===row.hash&&draft.checked?.length===exam.questions&&draft.checked.every(Boolean)&&scores.length===values.length&&scores.every((v,i)=>v!==''&&Number(v)===Number(values[i])))return 'Onaylandı · puanlar kaydedildi';
  return 'Kayıtlı sonuç var · yeni çalışma kontrol bekliyor';
 }
 return completed||row.hasReading?'Okundu · kontrol bekliyor':'Okunmayı bekliyor';
}
