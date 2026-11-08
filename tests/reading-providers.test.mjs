import test from 'node:test';import assert from 'node:assert/strict';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
import {readingRequestAccess} from '../reading-provider-server.mjs';
import {freshEvaluation,validateEvaluation} from '../src/visual-assessment.mjs';
import {bulkReadingDraft} from '../src/batch-pdf-reading.mjs';
import {hasCurrentSavedReading} from '../src/saved-class-reading.mjs';
import {applyCriterionScores} from '../src/rubric-scoring.mjs';
const hash='a'.repeat(64),area={id:'a',page:1,x:.1,y:.1,width:.6,height:.2};
const pdf={mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4 test').toString('base64')};
const image={mimeType:'image/jpeg',base64:Buffer.from([255,216,255,1]).toString('base64')};
const input=()=>({comparison:'visual-rubric',consent:true,questions:1,maxima:[100],targets:[1],rubric:[{question:1,answerAreas:[area],regions:[{...area,max:100,answerAreaIds:['a']}]}],studentImage:pdf,keyImage:pdf,closeups:[{question:1,role:'student',image}]});
const output=score=>({answers:[{question:1,regions:[{region:1,score,unclear:score===null,reason:'Kontrol'}],studentAreas:[area]}]});
test('API keys are provider-specific and never fall back to another provider',()=>{
 assert.deepEqual(readingRequestAccess({},'owner-key'),{provider:'gemini',apiKey:'owner-key'});
 assert.deepEqual(readingRequestAccess({'x-reading-provider':'claude'},'owner-key'),{provider:'claude',apiKey:''});
 assert.throws(()=>readingRequestAccess({'x-reading-provider':'unknown'}));
 assert.throws(()=>readingRequestAccess({'x-reading-provider':'openai','x-reading-api-key':'sk-ant-'+ 'a'.repeat(30)}).provider==='claude');
});
for(const provider of ['openai','claude']){
 test(provider+' receives correctly labeled PDFs, images, rubric and isolated credentials',async()=>{
  let calls=0;
  const result=await gradeVisualRubric(input(),{provider,apiKey:'test-secret',fetcher:async(url,options)=>{
   calls++;const body=JSON.parse(options.body);assert.ok(options.signal);assert.match(JSON.stringify(body),/ÖĞRENCİ KÂĞIDI/);assert.match(JSON.stringify(body),/ÖĞRETMEN CEVAP ANAHTARI/);
   if(provider==='openai'){assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(options.headers.Authorization,'Bearer test-secret');assert.equal(options.headers['x-api-key'],undefined);assert.equal(body.store,false);assert.equal(body.input[0].content.filter(p=>p.type==='input_file').length,2);assert.equal(body.input[0].content.filter(p=>p.type==='input_image').length,1);return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output(80))}]}]})}}
   assert.equal(url,'https://api.anthropic.com/v1/messages');assert.equal(options.headers['x-api-key'],'test-secret');assert.equal(options.headers.Authorization,undefined);assert.equal(body.messages[0].content.filter(p=>p.type==='document').length,2);assert.equal(body.messages[0].content.filter(p=>p.type==='image').length,1);return {ok:true,json:async()=>({stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(output(80))}]})};
  }});
  assert.equal(calls,1);assert.equal(result.answers[0].regions[0].score,80);
 });
 test(provider+' quota errors do not retry or switch provider',async()=>{
  let calls=0;await assert.rejects(gradeVisualRubric(input(),{provider,apiKey:'test',fetcher:async()=>{calls++;return {ok:false,status:429}}}),/kotası/);assert.equal(calls,1);
 });
 test(provider+' untrusted scores still pass through exact rubric validation',async()=>{
  await assert.rejects(gradeVisualRubric(input(),{provider,apiKey:'test',fetcher:async()=>({ok:true,json:async()=>provider==='openai'?{status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(output(101))}]}]}:{stop_reason:'end_turn',content:[{type:'text',text:JSON.stringify(output(101))}]}})}),/puanı doğrulanamadı/);
 });
 test(provider+' readings remain saved and recognized after teacher approval',()=>{
  const draft=bulkReadingDraft(freshEvaluation(hash,hash,1),{...output(80),provider,answers:[{question:1,regions:[{region:1,max:100,score:80,reason:'Kontrol'}],studentAreas:[area]}]});
  assert.equal(validateEvaluation(draft,1).reading[0].provider,provider);assert.equal(hasCurrentSavedReading(draft,hash,hash,1),true);
  assert.equal(applyCriterionScores(draft,0,draft.reading[0].geminiAreas).reading[0].provider,provider);
 });
}
