import {scanNumber} from './scan-data.mjs';
import {cropScanField,mappedArea} from './scan-vision.mjs';
function abortable(promise,signal){if(!signal)return promise;signal.throwIfAborted();return new Promise((resolve,reject)=>{const stop=()=>reject(new DOMException('Durduruldu','AbortError'));signal.addEventListener('abort',stop,{once:true});promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',stop)).catch(()=>{})})}
export async function createScoreScanReader(progress,signal){
 const {PaddleOCR}=await import('@paddleocr/paddleocr-js');
 const base=new URL('score-scan-engine/v1/',new URL(import.meta.env.BASE_URL,location.href));let worker,closed=false,digitWorker;
 progress?.('Ücretsiz okuma motoru hazırlanıyor. İlk kullanımda yaklaşık 80 MB indirilir…');
 let engine;try{signal?.throwIfAborted();engine=await abortable(PaddleOCR.create({worker:{createWorker:()=>worker=new Worker(new URL('worker.js',base),{type:'module'})},textDetectionModelName:'PP-OCRv6_small_det',textRecognitionModelName:'PP-OCRv6_small_rec',textDetectionModelAsset:{url:new URL('det.tar',base).href},textRecognitionModelAsset:{url:new URL('rec.tar',base).href},textRecognitionBatchSize:1,ortOptions:{backend:'wasm',wasmPaths:new URL('ort/',base).href,numThreads:1}}),signal)}catch(e){worker?.terminate();throw e}
 const close=async()=>{closed=true;try{await engine.dispose()}finally{worker?.terminate();await digitWorker?.terminate().catch(()=>{})}};
 async function digits(canvas,mode='7'){if(!digitWorker){const {createWorker}=await import('tesseract.js');digitWorker=await createWorker('eng',1);if(closed){await digitWorker.terminate();throw new Error('Okuma kapatıldı.')}await digitWorker.setParameters({tessedit_char_whitelist:'0123456789,.',tessedit_pageseg_mode:'7'})}await digitWorker.setParameters({tessedit_pageseg_mode:mode});const r=await digitWorker.recognize(canvas);return {text:r.data.text.trim(),confidence:r.data.confidence/100}}
 return {close,read:async(canvas,template,match,signal)=>{
  const fields={};const entries=Object.entries(template.fields).filter(([id])=>id!=='anchor');
  for(let i=0;i<entries.length;i++){
   if(closed)throw new Error('Okuma kapatıldı.');signal?.throwIfAborted();const [id,a]=entries[i];progress?.(`${i+1}/${entries.length} alan okunuyor…`);
   const crop=cropScanField(canvas,mappedArea(a,match));const [result]=await abortable(engine.predict(crop,{textDetBoxThresh:.35,textRecScoreThresh:0}),signal);signal?.throwIfAborted();
   const items=result.items||[],text=items.map(v=>v.text).join(' ').trim(),confidence=items.length?Math.min(...items.map(v=>v.score)):0;
   if(/^q\d+$/.test(id)||id==='total'){
    const first=scanNumber(text),candidates=[];let value='';
    for(const mode of (String(text).trim().length===1?['10','8','13']:['7','8','13'])){
     try{const other=await abortable(digits(crop,mode),signal);candidates.push(other);const second=scanNumber(other.text);if(first!==''&&first===second&&confidence>=.65&&other.confidence>=.65){value=first;break}}catch(e){if(signal?.aborted)throw e}
    }
    signal?.throwIfAborted();let note='';
    if(value===''&&first!==''&&confidence>=.9){
     const improved=document.createElement('canvas');improved.width=crop.width;improved.height=crop.height;const cx=improved.getContext('2d',{willReadFrequently:true});cx.drawImage(crop,0,0);const pixels=cx.getImageData(0,0,improved.width,improved.height);for(let k=0;k<pixels.data.length;k+=4){const v=.299*pixels.data[k]+.587*pixels.data[k+1]+.114*pixels.data[k+2],n=Math.max(0,Math.min(255,(v-128)*1.2+140));pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=n}cx.putImageData(pixels,0,0);
     const [check]=await abortable(engine.predict(improved,{textDetBoxThresh:.35,textRecScoreThresh:0}),signal);const checkText=(check.items||[]).map(r=>r.text).join(' ').trim(),checkConfidence=check.items?.length?Math.min(...check.items.map(r=>r.score)):0;
     if(scanNumber(checkText)===first&&checkConfidence>=.9){value=first;note='Puan iki görüntü okumasında aynı çıktı; ek rakam motoruyla doğrulanamadı. Görüntüden kontrol edin.'}
    }
    fields[id]={text,value,unclear:value==='',reason:value===''?`Puan doğrulanamadı. Okuma: ${text||'boş'} / ${candidates.map(c=>c.text||'boş').join(' / ')}`:note};
   }else fields[id]={text:confidence>=.65?text:'',unclear:confidence<.65,reason:confidence<.65?'Kimlik alanı net okunamadı.':''};
   crop.width=crop.height=0;
  }
  return fields;
 }};
}
