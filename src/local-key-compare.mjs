import {readQuestionLocally} from './local-ocr-review.mjs';
import {readPaperSymbols} from './local-symbols.mjs';
export function normalizedAnswer(text){return String(text||'').normalize('NFKC').toLocaleLowerCase('tr-TR').split('\n').filter(l=>!/^\s*\d+(?:[.,]\d+)?\s*puan\s*$/i.test(l)).join(' ').replace(/^\s*[a-zçğıöşü]\s*[).:]\s*/i,'').replace(/\s+/g,' ').trim()}
export function compareTextAnswer(student,key,max){
 const a=normalizedAnswer(student.text),b=normalizedAnswer(key.text),unclear={score:'',reason:'Güvenilir eşleşme yok; öğretmen kontrolü gerekli.'};
 if(!a)return {...unclear,reason:'Görüntü iyileştirmelerine rağmen öğrenci cevabından karşılaştırılabilir çıktı alınamadı.'};if(!b)return {...unclear,reason:'Cevap anahtarındaki bu alan güvenilir okunamadı.'};if(!Number.isFinite(student.confidence)||student.confidence<85)return {...unclear,reason:'Öğrenci cevabının OCR güveni karşılaştırma için düşük kaldı.'};if(!Number.isFinite(key.confidence)||key.confidence<85)return {...unclear,reason:'Cevap anahtarındaki alanın OCR güveni düşük kaldı.'};if(!Number.isFinite(max)||max<=0)return {...unclear,reason:'Anahtardaki alan puanı geçerli değil.'};
 if(/(?:soru|aşağıdaki|hangisi|yazınız|açıklayınız|\?)/i.test(b)||!/[a-zçğıöşü]/i.test(b))return unclear;
 if(a===b&&(b.length>=4||(['d','y'].includes(b)&&student.confidence>=95&&key.confidence>=95)))return {score:max,reason:'Anahtar ve öğrenci cevabında yüksek OCR güveniyle aynı ifade bulundu; öğretmen doğrulamalı.'};
 return {...unclear,reason:'Okunan cevaplar birebir eşleşmedi. Bu, cevabın yanlış olduğunu göstermez; anlam ve formüller öğretmen kontrolü gerektiriyor.'};
}
export function compareSymbolCells(student,key,max){
 if(!key.length||key.length!==student.length)return {score:'',reason:'Hücre sayıları eşleşmedi; alanları kontrol edin.'};
 if(!Number.isFinite(max)||max<=0)return {score:'',reason:'Anahtardaki alan puanını kontrol edin.'};let marked=0;for(let i=0;i<key.length;i++){const a=student[i],b=key[i];if(a.row!==b.row||a.column!==b.column)return {score:'',reason:'Tablo satır/sütunları eşleşmedi.'};if(a.blank&&b.blank)continue;if(!a.symbol||!b.symbol||!Number.isFinite(a.confidence)||!Number.isFinite(b.confidence)||a.confidence<75||b.confidence<75||a.symbol!==b.symbol)return {score:'',reason:'İşaret farklı veya belirsiz; öğretmen kontrolü gerekli.'};marked++}
 return marked?{score:max,reason:'Aynı hücrelerde aynı işaretler önerildi; sütunları öğretmen doğrulamalı.'}:{score:'',reason:'Karşılaştırılabilir işaret bulunamadı.'};
}
export async function compareQuestionToKey(paper,studentAreas,keyPaper,keyAreas,reader,signal,tone,onProgress){
 const rows=[];for(let i=0;i<keyAreas.length;i++){signal.throwIfAborted();const area=keyAreas[i],row={max:Number(area.max),score:'',reason:'Öğretmen kontrolü gerekli.'};onProgress?.(`${i+1}/${keyAreas.length} alan anahtarla karşılaştırılıyor…`);
 if(studentAreas.length!==keyAreas.length){rows.push({...row,reason:'Öğrenci ve anahtar alanlarının sayısı farklı. Alanları aynı sırayla seçin.'});continue}
 const a=await readPaperSymbols(paper,[studentAreas[i]],reader,signal,'original'),b=await readPaperSymbols(keyPaper,[area],reader,signal,'original');signal.throwIfAborted();let compared=compareSymbolCells(a,b,row.max);
 if(compared.score===''){onProgress?.(`${i+1}. alan: görüntüden eşleşme bulunamadı; arka planda OCR metniyle yeniden deneniyor…`);const key=await readQuestionLocally(keyPaper,[area],reader,signal),student=await readQuestionLocally(paper,[studentAreas[i]],reader,signal,null,'original');signal.throwIfAborted();compared=compareTextAnswer(student,key,row.max)}
 rows.push({...row,...compared});
 }return rows;
}
export function resetQuestionForReading(draft,index){return {...draft,marks:draft.marks.filter(m=>m.question!==index+1),manualScores:draft.manualScores.map((v,i)=>i===index?0:v),baseScores:draft.manualScores.map((_,i)=>i===index?0:Number(draft.baseScores?.[i]||0)),checked:draft.checked.map((v,i)=>i===index?false:v),reading:draft.reading.map((v,i)=>i===index?{text:'',status:'unread'}:v)}}
export function proposalContext(draft,index){return JSON.stringify({areas:draft.areas[index],key:draft.keySignature,tone:draft.imageTones?.[index]||'original'})}

export function resetAllForReading(draft){return draft.manualScores.reduce((next,_,i)=>resetQuestionForReading(next,i),draft)}
