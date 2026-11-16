import test from 'node:test';
import assert from 'node:assert/strict';
import {readingDeadline} from '../src/reading-deadline.mjs';
import {readingLabel} from '../src/ocr-review-data.mjs';
test('a stalled session or crop reports a bounded explicit timeout',async()=>{await assert.rejects(readingDeadline(()=>new Promise(()=>{}),{milliseconds:10,message:'Oturum yanıt vermedi.'}),{name:'TimeoutError',message:'Oturum yanıt vermedi.'});});
test('cancelled work never starts; in-flight cancellation returns immediately',async()=>{const first=new AbortController();first.abort();let called=false;await assert.rejects(readingDeadline(()=>{called=true;},{signal:first.signal}),{name:'AbortError'});assert.equal(called,false);const control=new AbortController();const pending=readingDeadline(()=>new Promise(()=>{}),{signal:control.signal});control.abort();await assert.rejects(pending,{name:'AbortError'});});
test('successful and failed operations retain their outcomes',async()=>{assert.equal(await readingDeadline(()=>Promise.resolve(12)),12);await assert.rejects(readingDeadline(()=>{throw Error('Kota doldu');}),/Kota doldu/);});
test('a failed Gemini reading is not presented as still waiting for points',()=>{const label=readingLabel({provider:'gemini',status:'failed',reason:'Kota doldu'});assert.match(label,/okuma tamamlanamadı/);assert.doesNotMatch(label,/bekleniyor/);});
