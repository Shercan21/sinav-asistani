import {normalizeReading} from './ocr-data.mjs';
import {validateKey} from './exam-data.mjs';
export function subquestionIssue(keyText,answerText){
  const labels=text=>new Set([...text.matchAll(/(?:^|[\s.;:])([a-h])\s*\)/gimu)].map(m=>m[1].toLowerCase()));
  const expected=labels(keyText),actual=labels(answerText);
  if(expected.size<2)return '';
  const missing=[...expected].filter(label=>!actual.has(label)),extra=[...actual].filter(label=>!expected.has(label));
  if(missing.length)return `Okuma sonucunda ${missing.map(x=>x+')').join(', ')} alt bölüm etiketi bulunmuyor. Bu, öğrencinin boş bıraktığını kanıtlamaz; asıl kâğıdı kontrol edin veya ayrıntılı yeniden okuyun.`;
  if(extra.length)return 'Okunan alt bölümler cevap anahtarıyla eşleşmiyor. Sütun devamı yanlış soruya bağlanmış olabilir; asıl kâğıdı kontrol edin.';
  return '';
}
export function validateGradeInput(input){
  if(!input||!Number.isInteger(input.questions)||input.questions<1||input.questions>200||!['Klasik','Karma'].includes(input.examType)||!Array.isArray(input.key)||!validateKey(input.key,input.questions,input.examType)||input.key.some(q=>typeof q.answer!=='string'||q.answer.length>10000))throw new Error('Kayıtlı cevap anahtarı geçersiz.');
  const reading=normalizeReading(input.reading,input.questions);
  if(JSON.stringify({key:input.key,reading}).length>180000)throw new Error('Cevaplar ve ölçütler çok uzun. Daha kısa metin kullanın.');
  return {...input,reading,key:input.key.map(q=>({max:Number(q.max),answer:q.answer}))};
}
export function normalizeProposal(data,input){
  const checked=validateGradeInput(input);
  if(!data||!Array.isArray(data.answers)||data.answers.length!==checked.questions)throw new Error('Puan önerisi doğrulanamadı.');
  const seen=new Set();
  for(const row of data.answers){
    if(!Number.isInteger(row.question)||row.question<1||row.question>checked.questions||seen.has(row.question)||typeof row.reason!=='string'||row.reason.length>3000||typeof row.unclear!=='boolean'||(row.score!==null&&(typeof row.score!=='number'||!Number.isFinite(row.score)||row.score<0||row.score>checked.key[row.question-1].max)))throw new Error('Puan önerisi doğrulanamadı.');
    seen.add(row.question);
  }
  return {answers:checked.key.map((key,i)=>{
    const row=data.answers.find(r=>r.question===i+1),answer=checked.reading.answers[i];
    if(!key.answer.trim())return {question:i+1,score:null,unclear:true,reason:'Cevap anahtarında bu soru için cevap veya rubrik yok. Öğretmen değerlendirmesi gerekli.'};
    if(answer.unclear)return {question:i+1,score:null,unclear:true,reason:'Öğrenci cevabının okuması belirsiz. Kâğıtla karşılaştırıp düzeltin.'};
    const issue=subquestionIssue(key.answer,answer.text);
    if(issue)return {question:i+1,score:null,unclear:true,reason:issue};
    return {...row,score:row.unclear?null:row.score,unclear:row.unclear||row.score===null};
  })};
}
export async function proposalContext(key,reading){
  const stable=value=>Array.isArray(value)?value.map(stable):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])])):value;
  const bytes=new TextEncoder().encode(JSON.stringify(stable({version:3,key,reading})));
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
}
