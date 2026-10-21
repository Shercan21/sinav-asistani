import {readQuestionLocally} from './local-ocr-review.mjs';
import {readPaperSymbols} from './local-symbols.mjs';
export function normalizedAnswer(text){return String(text||'').normalize('NFKC').toLocaleLowerCase('tr-TR').split('\n').filter(l=>!/^\s*\d+(?:[.,]\d+)?\s*puan\s*$/i.test(l)).join(' ').replace(/^\s*[a-zçğıöşü]\s*[).:]\s*/i,'').replace(/\s+/g,' ').trim()}
export function compareTextAnswer(student,key,max){
 const a=normalizedAnswer(student.text),b=normalizedAnswer(key.text),unclear={score:'',reason:'Güvenilir eşleşme yok; öğretmen kontrolü gerekli.'};
 if(!a||!b||!Number.isFinite(student.confidence)||!Number.isFinite(key.confidence)||!Number.isFinite(max)||max<=0||student.confidence<85||key.confidence<85)return unclear;
 if(/(?:soru|aşağıdaki|hangisi|yazınız|açıklayınız|\?)/i.test(b)||!/[a-zçğıöşü]/i.test(b))return unclear;
 if(a===b&&(b.length>=4||(['d','y'].includes(b)&&student.confidence>=95&&key.confidence>=95)))return {score:max,reason:'Anahtar ve öğrenci cevabında yüksek OCR güveniyle aynı ifade bulundu; öğretmen doğrulamalı.'};
 return unclear;
}
export function compareSymbolCells(student,key,max){
 if(!key.length||key.length!==student.length)return {score:'',reason:'Hücre sayıları eşleşmedi; alanları kontrol edin.'};
 if(!Number.isFinite(max)||max<=0)return {score:'',reason:'Anahtardaki alan puanını kontrol edin.'};let marked=0;for(let i=0;i<key.length;i++){const a=student[i],b=key[i];if(a.row!==b.row||a.column!==b.column)return {score:'',reason:'Tablo satır/sütunları eşleşmedi.'};if(a.blank&&b.blank)continue;if(!a.symbol||!b.symbol||!Number.isFinite(a.confidence)||!Number.isFinite(b.confidence)||a.confidence<75||b.confidence<75||a.symbol!==b.symbol)return {score:'',reason:'İşaret farklı veya belirsiz; öğretmen kontrolü gerekli.'};marked++}
 return marked?{score:max,reason:'Aynı hücrelerde aynı işaretler önerildi; sütunları öğretmen doğrulamalı.'}:{score:'',reason:'Karşılaştırılabilir işaret bulunamadı.'};
}
export async function compareQuestionToKey(paper,studentAreas,keyPaper,keyAreas,reader,signal,tone,onProgress){
 const rows=[];for(let i=0;i<keyAreas.length;i++){signal.throwIfAborted();const area=keyAreas[i],row={max:Number(area.max),score:'',reason:'Öğretmen kontrolü gerekli.'};onProgress?.(`${i+1}/${keyAreas.length} alan anahtarla karşılaştırılıyor…`);
 if(studentAreas.length!==keyAreas.length){rows.push({...row,reason:'Öğrenci ve anahtar alanlarının sayısı farklı. Alanları aynı sırayla seçin.'});continue}
 const key=await readQuestionLocally(keyPaper,[area],reader,signal),student=await readQuestionLocally(paper,[studentAreas[i]],reader,signal,null,tone);signal.throwIfAborted();let compared=compareTextAnswer(student,key,row.max);
 if(compared.score===''){const a=await readPaperSymbols(paper,[studentAreas[i]],reader,signal,tone),b=await readPaperSymbols(keyPaper,[area],reader,signal,'contrast');signal.throwIfAborted();const symbols=compareSymbolCells(a,b,row.max);if(symbols.score!=='')compared=symbols}
 rows.push({...row,...compared});
 }return rows;
}
export function resetQuestionForReading(draft,index){return {...draft,marks:draft.marks.filter(m=>m.question!==index+1),manualScores:draft.manualScores.map((v,i)=>i===index?0:v),baseScores:draft.manualScores.map((_,i)=>i===index?0:Number(draft.baseScores?.[i]||0)),checked:draft.checked.map((v,i)=>i===index?false:v),reading:draft.reading.map((v,i)=>i===index?{text:'',status:'unread'}:v)}}
export function proposalContext(draft,index){return JSON.stringify({areas:draft.areas[index],key:draft.keySignature,tone:draft.imageTones?.[index]||'original'})}
