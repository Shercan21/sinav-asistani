import test from 'node:test';
import assert from 'node:assert/strict';
import {pointValue,moveArea,rubricScores,validVisualRubric,evaluationScores,validateEvaluation,validateVisualKey,freshEvaluation} from '../src/visual-assessment.mjs';
import {validateBackup} from '../src/backup-data.mjs';
import {gradeExam} from '../src/exam-data.mjs';
const area=(id,max)=>({id,page:1,x:.1,y:.2,width:.5,height:.2,max});
const key=()=>({id:'key1',name:'Kayıtlı anahtar',paperId:'e:__key_key1__',paperFingerprint:'a'.repeat(64),questions:2,regions:[[area('a',20),area('b',20)],[area('c',60)]]});
const draft=()=>({version:1,paperFingerprint:'b'.repeat(64),keySignature:'c'.repeat(64),areas:[[area('s1')],[area('s2')]],marks:[],manualScores:[0,''],checked:[false,false],reading:[{text:'',status:'unread'},{text:'',status:'failed'}]});
test('decimal comma points count, prose and invalid or negative numbers do not',()=>{assert.equal(pointValue('2,5'),2.5);assert.equal(pointValue('2.50'),2.5);assert.equal(pointValue('0'),0);for(const s of ['-2','2 puan','101','2,5,3',''])assert.equal(pointValue(s),null)});
test('corner resize and dragging preserve bounds and minimum selectable size',()=>{const a=area('a',2);const moved=moveArea(a,'move',2,-1);assert.equal(moved.x,.5);assert.equal(moved.y,0);const resized=moveArea(a,'nw',3,3);assert.ok(resized.width>=.0099);assert.ok(resized.height>=.0099);assert.ok(resized.x+resized.width<=1)});
test('multi-area rubric sums per question without inventing points',()=>{const k=key();assert.deepEqual(rubricScores(k.regions),[40,60]);assert.ok(validVisualRubric(k.regions));k.regions[0][0].max='';assert.equal(validVisualRubric(k.regions),false)});
test('point annotations sum once, ignore notes, allow zero and deletion',()=>{const d=draft();d.marks=[{id:'m1',question:1,kind:'text',page:1,x:.2,y:.3,size:.02,color:'#cc0000',text:'2,5',score:2.5},{id:'m2',question:1,kind:'text',page:1,x:.3,y:.3,size:.02,color:'#cc0000',text:'Not: 20'}];assert.ok(validateEvaluation(d,2));assert.deepEqual(evaluationScores(d),[2.5,'']);d.marks=[];assert.deepEqual(evaluationScores(d),[0,'']);d.marks=[{id:'bad',question:1,kind:'text',page:1,x:.2,y:.3,size:.02,color:'#cc0000',text:'2,5',score:25}];assert.throws(()=>validateEvaluation(d,2))});
test('changing paper resets geometry and marks; key changes invalidate checks',()=>{const d=draft();d.checked=[true,true];const restored=freshEvaluation(d.paperFingerprint,'d'.repeat(64),2,d,null);assert.deepEqual(restored.checked,[false,false]);const replacement=freshEvaluation('e'.repeat(64),'c'.repeat(64),2,d,null,[12,20]);assert.equal(replacement.marks.length,0);assert.deepEqual(replacement.areas,[[],[]]);assert.deepEqual(replacement.manualScores,[12,20])});
test('key library, drafts and point marks survive backup without overwriting final grades',()=>{const k=key(),e={id:'e',name:'Sınav',subject:'Kimya',className:'9-A',type:'Klasik',questions:2,key:[{max:40,answer:'',visual:true},{max:60,answer:'',visual:true}],visualKeys:[k],visualRubric:k,evaluations:{s:draft()},results:{s:[12,20]}};const data={format:'sinav-asistani',version:1,classes:[{id:'c',name:'9-A',count:1,students:[{id:'s',number:'1',name:'Örnek'}]}],exams:[e],papers:[{id:k.paperId,name:'key.png',type:'image/png',base64:'AAAA'}]};assert.ok(validateBackup(data));assert.deepEqual(e.results.s,[12,20]);assert.equal(gradeExam(e,e.results.s),32);data.exams[0].evaluations.unknown=draft();assert.throws(()=>validateBackup(data))});
test('legacy multiple-choice grades remain valid alongside new numeric visual grading',()=>{const e={type:'Test',questions:2,key:[{max:40,answer:'A',visual:true},{max:60,answer:'B',visual:true}],visualRubric:key()};assert.equal(gradeExam(e,['A','B']),100);assert.equal(gradeExam(e,[20,30]),50)});
test('invalid geometry and duplicate rubric ids reject backup',()=>{const k=key();assert.ok(validateVisualKey(k,2));k.regions[0][1].id='a';assert.throws(()=>validateVisualKey(k,2));});

 test('student deletion removes only that student evaluation and preserves key library',async()=>{
 const {planDeletion}=await import('../src/delete-data.mjs');
 const classes=[{id:'c',name:'9-A',count:2,students:[{id:'s',number:'1',name:'A'},{id:'t',number:'2',name:'B'}]}];
 const exams=[{id:'e',className:'9-A',evaluations:{s:{sample:1},t:{sample:2}},visualKeys:[{id:'k'}]}];
 const result=planDeletion(classes,exams,{classId:'c',studentId:'s'},[['e:s',{}],['e:__key_k__',{}]]);
 assert.deepEqual(result.exams[0].evaluations,{t:{sample:2}});
 assert.deepEqual(result.exams[0].visualKeys,[{id:'k'}]);
 assert.deepEqual(result.paperIds,['e:s']);
 });
