import test from 'node:test';
import assert from 'node:assert/strict';
import {extractKeyExplanations} from '../key-explanations-server.mjs';
import {missingExplanations,requireExplanations,normalizeExplanations} from '../src/key-explanations.mjs';
import {emptyInstructions,validateInstructions,instructionContext} from '../src/reading-instructions.mjs';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
const pdf={mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4 KEY ONLY').toString('base64')};
const result={explanations:[{question:1,source:'key',page:1,text:'Renk değişimi ve katı oluşumunun belirtildiği cevaplar'},{question:2,source:'missing',page:1,text:''},{question:3,source:'unreadable',page:2,text:''}]};
test('extracts only explicit explanation text from key, distinguishes absent/unreadable, never sends student papers',async()=>{
 const data=await extractKeyExplanations({questions:3,targets:[1,2,3],consent:true,keyImage:pdf,studentImage:{secret:'STUDENT NEVER SENT'}},{apiKey:'test',fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body),wire=JSON.stringify(body);assert.equal(wire.includes('STUDENT NEVER SENT'),false);assert.match(wire,/Örnek Öğrenci Cevabı/);assert.match(wire,/açıklama üretme/);assert.equal(body.contents[0].parts.filter(p=>p.inlineData).length,1);
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(result)}]}}]})};
 }});
 const instructions=emptyInstructions(3);instructions.questions.forEach((q,i)=>q.explanation=data.explanations[i].explanation);
 assert.deepEqual(missingExplanations(instructions,[1,2,3]),[2,3]);assert.throws(()=>requireExplanations(instructions,[2]),/öğretmen/);assert.doesNotThrow(()=>requireExplanations(instructions,[1]));
 instructions.questions[1].explanation={source:'teacher',text:'Öğretmenin kabul koşulları.'};validateInstructions(instructions,3);requireExplanations(instructions,[1,2]);
 const restored=JSON.parse(JSON.stringify(instructions));assert.equal(instructionContext(restored,3,[1]).questions[0].answerExplanation.text,result.explanations[0].text);
});
test('rejects fabricated explanation source, cross-question mapping, overlong text and missing key page',()=>{
 for(const mutate of [r=>r.explanations.pop(),r=>r.explanations[1].question=1,r=>r.explanations[0].source='model',r=>r.explanations[1].text='Invented from example',r=>r.explanations[0].page=0,r=>r.explanations[0].text='x'.repeat(3001)]){const bad=structuredClone(result);mutate(bad);assert.throws(()=>normalizeExplanations(bad,3,[1,2,3]));}
});
test('a missing required explanation stops before student extraction or scoring',async()=>{
 const instructions=emptyInstructions(1);instructions.explanationsRequired=true;
 let calls=0;await assert.rejects(gradeVisualRubric({comparison:'visual-rubric',consent:true,questions:1,maxima:[10],targets:[1],instructions,studentImage:pdf,keyImage:pdf,rubric:[{question:1,regions:[{page:1,x:.1,y:.2,width:.5,height:.2,max:10}]}]},{apiKey:'test',fetcher:async()=>{calls++;throw Error('must not call')}}),/cevap açıklaması eksik/);assert.equal(calls,0);
});
test('teacher-selected crop needs no heading, retains original page and teacher edits replace extracted text in grading context',async()=>{
 const selectedRegion={page:3,x:.1,y:.2,width:.6,height:.2};
 const result=await extractKeyExplanations({consent:true,questions:6,targets:[4],keyImage:pdf,selectedRegion},{apiKey:'test',fetcher:async(_url,options)=>{
  assert.match(JSON.parse(options.body).systemInstruction.parts[0].text,/Başlık bulunması gerekmez/);
  return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({explanations:[{question:4,source:'key',page:1,text:'Atom sayılan korunur'}]})}]}}]})};
 }});
 assert.equal(result.explanations[0].explanation.page,3);
 const instructions=emptyInstructions(6);instructions.questions[3].explanation=result.explanations[0].explanation;instructions.questions[3].explanationArea=selectedRegion;validateInstructions(instructions,6);
 instructions.questions[3].explanation={source:'teacher',text:'Atom sayıları korunur.'};
 const restored=JSON.parse(JSON.stringify(instructions));validateInstructions(restored,6);
 assert.equal(instructionContext(restored,6,[4]).questions[0].answerExplanation.text,'Atom sayıları korunur.');requireExplanations(restored,[4]);
});
