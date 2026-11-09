import {bulkReadingDraft} from '../src/batch-pdf-reading.mjs';
import {freshEvaluation} from '../src/visual-assessment.mjs';
import {criterionRowsForScore} from '../src/rubric-links.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
import {groundVisualScores,validateStudentEvidence,corroborateStudentEvidence} from '../student-evidence-server.mjs';
const area={page:1,x:.1,y:.2,width:.6,height:.2};
const pdf=s=>({mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4 '+s).toString('base64')});
const observation={id:'q1-a',question:1,kind:'writing',text:'17 akb',...area};
const response=data=>({ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(data)}]}}]})});
const input=()=>({comparison:'visual-rubric',consent:true,questions:1,maxima:[10],targets:[1],studentImage:pdf('STUDENT'),keyImage:pdf('KEY'),templateImage:pdf('OTHER-STUDENT'),instructions:{version:1,rules:[],examNote:'SECRET CORRECT ANSWER',questions:[{rules:[],note:''}]},rubric:[{question:1,regions:[{...area,max:10,alternatives:['SECRET ALTERNATIVE']}]}],closeups:[{question:1,role:'student',image:pdf('STUDENT-CROP')},{question:1,role:'key',image:pdf('KEY-CROP')}]});
test('extracts student evidence without key, model paper, rubric alternatives or answer-bearing instructions; grading cannot invent a quote',async()=>{
 const original=input(),bodies=[];
 const result=await gradeVisualRubric(original,{apiKey:'test',fetcher:async(_url,options)=>{
  const body=JSON.parse(options.body);bodies.push(body);
  if(bodies.length<=2){
   const wire=JSON.stringify(body),images=body.contents[0].parts.filter(p=>p.inlineData).map(p=>p.inlineData.data);
   assert.deepEqual(images,bodies.length===1?[original.studentImage.base64,original.closeups[0].image.base64]:[original.studentImage.base64]);
   for(const secret of ['SECRET CORRECT ANSWER','SECRET ALTERNATIVE',original.keyImage.base64,original.templateImage.base64,original.closeups[1].image.base64])assert.equal(wire.includes(secret),false);
   return response({observations:[observation]});
  }
  assert.match(JSON.stringify(body),/studentEvidence/);
  return response({answers:[{question:1,regions:[{region:1,score:10,reason:'3,4 N_A akb doğru.',unclear:false,evidenceId:'q1-a',studentQuote:'3,4 N_A akb'}],studentAreas:[area]}]});
 }});
 assert.equal(bodies.length,3);assert.equal(result.answers[0].regions[0].score,'');assert.match(result.answers[0].regions[0].reason,/kanıtı yok/);
});
test('valid evidence stays visible; missing, foreign-question, fabricated, unreadable and positive-blank evidence never awards points',()=>{
 const row={region:1,score:5,reason:'Kısmi puan.',unclear:false,evidenceId:'q1-a',studentQuote:'17 akb'};
 const score=(r,obs=[observation])=>groundVisualScores({answers:[{question:1,regions:[r]}]},obs).answers[0].regions[0];
 assert.equal(score(row).score,5);assert.match(score(row).reason,/Öğrenci kanıtı.*17 akb/);
 for(const r of [{...row,evidenceId:''},{...row,studentQuote:''},{...row,studentQuote:'3,4 NA akb'},{...row,evidenceId:'q2'}])assert.equal(score(r).score,null);
 for(const o of [{...observation,question:2},{...observation,kind:'unreadable'},{...observation,kind:'blank'}])assert.equal(score(row,[o]).score,null);
 assert.equal(score({...row,score:0},[{...observation,kind:'blank'}]).score,0);
});
test('bad extraction or service failure stops before grading and never substitutes an answer key',async()=>{
 for(const bad of [{observations:[{...observation,x:2}]},{observations:[observation,observation]},{observations:[{...observation,question:2}]}])assert.throws(()=>validateStudentEvidence(bad,[1]));
 let calls=0;await assert.rejects(gradeVisualRubric(input(),{apiKey:'test',fetcher:async()=>{calls++;return {ok:false,status:503};}}),/çıkarılamadı/);assert.equal(calls,1);
 calls=0;await assert.rejects(gradeVisualRubric(input(),{apiKey:'test',fetcher:async()=>{calls++;return response({observations:[{...observation,page:0}]});}}),/doğrulanamadı/);assert.equal(calls,1);
});

test('independent disagreement on molecule counts, subscripts, charge or position blocks positive AND zero scores',()=>{
 for(const second of [{...observation,text:'1,7 akb'},{...observation,question:2},{...observation,page:2},{...observation,x:.8,width:.1},{...observation,kind:'unreadable'}]){
  const checked=corroborateStudentEvidence([observation],[second]);assert.equal(checked[0].verified,false);
  for(const score of [0,10]){const result=groundVisualScores({answers:[{question:1,regions:[{region:1,score,unclear:false,evidenceId:'q1-a',studentQuote:'17 akb',reason:'test'}]}]},checked);assert.equal(result.answers[0].regions[0].score,null);assert.match(result.answers[0].regions[0].reason,/İki bağımsız/);}
 }
 for(const [a,b] of [['HCl','H₂Cl'],['OH⁻','OH'],['1 O₂ molekülü','2 O₂ molekülü']])assert.equal(corroborateStudentEvidence([{...observation,text:a}],[{...observation,text:b}])[0].verified,false);
 assert.equal(corroborateStudentEvidence([observation],[{...observation,id:'different-id'}])[0].verified,true);
});

test('a disputed criterion leaves the whole question pending while retaining visible known suggestions',()=>{
 const draft=freshEvaluation('a'.repeat(64),'b'.repeat(64),1);
 const rows=[{region:1,max:5,score:5,reason:'Doğrulandı.'},{region:2,max:5,score:'',reason:'İki bağımsız okuma uyuşmadı.'}];
 const result=bulkReadingDraft(draft,{answers:[{question:1,regions:rows,studentAreas:[area]}]});
 assert.equal(result.manualScores[0],'');assert.equal(result.checked[0],false);
 assert.deepEqual(criterionRowsForScore(result,0,''),rows);assert.equal(result.results,undefined);
});
