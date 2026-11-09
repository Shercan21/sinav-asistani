import test from 'node:test';import assert from 'node:assert/strict';
import {emptyInstructions,validateInstructions,copyInstructions,instructionContext} from '../src/reading-instructions.mjs';
import {cloneRubricSelections} from '../src/rubric-links.mjs';
import {visualSignature} from '../src/visual-assessment.mjs';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
import {validateBackup} from '../src/backup-data.mjs';
const hash='a'.repeat(64),area={id:'area',page:1,x:.1,y:.1,width:.6,height:.2},criterion={...area,id:'criterion',max:100,answerAreaIds:['area'],alternatives:['çökelti oluşumu']};
const instructions=emptyInstructions(1);instructions.examNote='Bu sınava özel açıklama';instructions.questions[0]={rules:['subparts','method'],note:'Sadece birinci sorunun notu'};
const key={id:'k',name:'Test',paperId:'e:__key_k__',paperFingerprint:hash,questions:1,answerRegions:[[area]],regions:[[criterion]],instructions};
test('old keys remain unchanged; cloned keys preserve instructions and criterion alternatives',()=>{
 assert.equal(validateInstructions(undefined,1),undefined);const source=structuredClone(key),clone=cloneRubricSelections(key);
 assert.deepEqual(key,source);assert.deepEqual(clone.instructions,instructions);assert.deepEqual(clone.regions[0][0].alternatives,criterion.alternatives);assert.notEqual(clone.answerRegions[0][0].id,area.id);assert.equal(clone.regions[0][0].answerAreaIds[0],clone.answerRegions[0][0].id);
 const old={...key};delete old.instructions;assert.equal(cloneRubricSelections(old).instructions,undefined);
});
test('reusing instructions across question counts copies only common guidance',()=>{
 const copy=copyInstructions(instructions,2);assert.equal(copy.examNote,instructions.examNote);assert.deepEqual(copy.rules,instructions.rules);assert.deepEqual(copy.questions,[{rules:[],note:''},{rules:[],note:''}]);copy.rules.push('model');assert.equal(instructions.rules.includes('model'),false);
});
test('guidance is bounded and restricted to actual targets; signatures detect edits',async()=>{
 const i=emptyInstructions(2);i.questions[0].note='ONLY_Q1';i.questions[1].note='ONLY_Q2';assert.equal(JSON.stringify(instructionContext(i,2,[1])).includes('ONLY_Q2'),false);
 for(const bad of [{...i,rules:['fake']},{...i,rules:['units','units']},{...i,questions:[]},{...i,examNote:'x'.repeat(4001)}])assert.throws(()=>validateInstructions(bad,2));
 assert.notEqual(await visualSignature([{max:100}],key),await visualSignature([{max:100}],{...key,instructions:{...instructions,examNote:'changed'}}));
});
test('backup roundtrip retains guidance and alternatives without changing saved grades',()=>{
 const exam={id:'e',name:'Test',subject:'Kimya',className:'Test class',type:'Klasik',questions:1,key:[{max:100,visual:true,answer:''}],visualKeys:[key],visualRubric:key,results:{}};
 const data={format:'sinav-asistani',version:1,classes:[{id:'c',name:'Test class',count:0,students:[]}],exams:[exam],papers:[]};assert.ok(validateBackup(JSON.parse(JSON.stringify(data))));assert.equal(data.exams[0].visualRubric.instructions.examNote,instructions.examNote);assert.deepEqual(data.exams[0].results,{});
});
test('selected guidance and alternatives reach the grading request together',async()=>{
 const image={mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4 test').toString('base64')},input={comparison:'visual-rubric',consent:true,questions:1,maxima:[100],targets:[1],rubric:[{question:1,answerAreas:[area],regions:[criterion]}],studentImage:image,keyImage:image,instructions};let calls=0;
 const result=await gradeVisualRubric(input,{apiKey:'mock',fetcher:async(_url,options)=>{calls++;const body=JSON.parse(options.body),context=JSON.parse(body.contents[0].parts.find(p=>p.text?.startsWith('{')).text);assert.equal(context.teacherGuidance.examNote,instructions.examNote);assert.equal(context.teacherGuidance.questions[0].note,instructions.questions[0].note);assert.deepEqual(context.rubric[0].criteria[0].acceptableAlternatives,criterion.alternatives);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answers:[{question:1,regions:[{region:1,score:70,unclear:false,reason:'Mock'}],studentAreas:[]}]})}]}}]})}}});assert.equal(calls,1);assert.equal(result.answers[0].regions[0].score,70);
});
