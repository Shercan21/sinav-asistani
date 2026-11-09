import {withStudentEvidence} from './evidence-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {upgradeRubricKey,cloneRubricSelections,linkedRubricReady,criterionStudentAreas,criterionRowsForScore} from '../src/rubric-links.mjs';
import {validateIdentityRegions,readIdentityRegions} from '../src/identity-regions.mjs';
import {freshEvaluation,validateVisualKey} from '../src/visual-assessment.mjs';
import {validateGeminiVisual,normalizeGeminiVisual} from '../src/gemini-visual-data.mjs';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
import {applyCriterionScores} from '../src/rubric-scoring.mjs';
import {proposalContext} from '../src/local-key-compare.mjs';
import {scoreMarkersForDraft} from '../src/score-markers.mjs';
import {validateBackup} from '../src/backup-data.mjs';
const area=(id,extra={})=>({id,page:1,x:.1,y:.1,width:.4,height:.15,...extra});
const key=()=>({id:'key1',name:'Örnek anahtar',paperId:'e:__key_key1__',paperFingerprint:'a'.repeat(64),questions:1,answerRegions:[[area('search')]],regions:[[area('formula',{max:50,label:'Formül',answerAreaIds:['search']}),area('process',{max:30,label:'İşlem',answerAreaIds:['search']}),area('result',{max:20,label:'Sonuç',answerAreaIds:['search']})]],identityRegions:{name:[area('name')],number:[area('number',{x:.6,width:.2})],className:[area('class',{y:.4})]}});
const image={mimeType:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10]).toString('base64')};
const input=()=>({comparison:'visual-rubric',consent:true,questions:1,maxima:[100],targets:[1],rubric:[{question:1,answerAreas:key().answerRegions[0],regions:key().regions[0],studentSearchAreas:[]}],studentImage:image,keyImage:image,closeups:[]});
const output=()=>({answers:[{question:1,regions:[50,30,20].map((score,i)=>({region:i+1,score,reason:'Doğru.',unclear:false})),studentAreas:[area('unused',{answerAreaId:'search'})]}]});
test('one answer search zone supports three independent visual criteria and legacy upgrade retains points',()=>{
 const k=key();assert.equal(validateVisualKey(k,1),k);assert.ok(linkedRubricReady(k));
 const old=structuredClone(k);delete old.answerRegions;old.regions[0].forEach(a=>delete a.answerAreaIds);const upgraded=upgradeRubricKey(old);assert.deepEqual(upgraded.regions[0].map(a=>a.max),[50,30,20]);assert.equal(upgraded.answerRegions[0].length,1);assert.ok(linkedRubricReady(upgraded));
 k.regions[0][0].answerAreaIds=[];assert.ok(validateVisualKey(k,1));assert.equal(linkedRubricReady(k),false);k.regions[0][0].answerAreaIds=['other-question'];assert.throws(()=>validateVisualKey(k,1));
});
test('library clone remaps search, criterion and identity IDs without losing multiple links',()=>{
 const k=key();k.answerRegions[0].push(area('search2',{page:2}));k.regions[0][0].answerAreaIds.push('search2');let n=0;const c=cloneRubricSelections(k,()=>`new-${++n}`);assert.deepEqual(c.regions[0][0].answerAreaIds,c.answerRegions[0].map(a=>a.id));assert.equal(c.answerRegions[0][1].page,2);assert.notEqual(c.identityRegions.name[0].id,'name');assert.ok(linkedRubricReady({...k,...c}));assert.equal(k.answerRegions[0][0].id,'search');
});
test('Gemini validates linked criteria and returns one student region for multiple criteria; unmapped falls back safely',async()=>{
 const i=input();assert.ok(validateGeminiVisual(i));let calls=0;
 const result=await gradeVisualRubric(i,{apiKey:'test',fetcher:withStudentEvidence(async(url,options)=>{calls++;const body=JSON.parse(options.body);assert.match(JSON.stringify(body),/ölçüt sayısı ile öğrenci alanı sayısının eşit olması gerekmez/);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(output())}]}}]})}})});
 assert.equal(calls,1);assert.equal(result.answers[0].studentAreas.length,1);assert.deepEqual(result.answers[0].regions.map(a=>a.answerAreaIds),[['search'],['search'],['search']]);
 const a=result.answers[0].studentAreas;assert.deepEqual(criterionStudentAreas(result.answers[0].regions[2],a),a);assert.deepEqual(criterionStudentAreas({answerAreaIds:['unknown']},a),a);
 const bad=output();bad.answers[0].studentAreas[0].answerAreaId='foreign';assert.throws(()=>normalizeGeminiVisual(bad,i));i.rubric[0].regions[0].answerAreaIds=['foreign'];assert.throws(()=>validateGeminiVisual(i));
});
test('criterion correction preserves breakdown, zero and geometry while removing old point marks and invalidating approval',()=>{
 const d=freshEvaluation('a'.repeat(64),'b'.repeat(64),1);d.areas[0]=[area('student',{answerAreaId:'search'})];d.checked[0]=true;
 d.marks=[{id:'old',question:1,kind:'text',page:1,x:.2,y:.2,size:.02,color:'#cc0000',text:'5',score:5}];
 const rows=normalizeGeminiVisual(output(),input()).answers[0].regions;rows[1].score=0;const next=applyCriterionScores(d,0,rows);
 assert.equal(next.manualScores[0],70);assert.equal(next.marks.length,0);assert.equal(next.checked[0],false);assert.equal(d.marks.length,1);assert.equal(next.reading[0].geminiContext,proposalContext(next,0));assert.equal(criterionRowsForScore(next,0,70).length,3);assert.equal(criterionRowsForScore(next,0,'').length,0);
 assert.deepEqual(scoreMarkersForDraft(next,[70]).map(m=>[m.criterion,m.score]),[[1,50],[2,0],[3,20]]);next.areas[0][0].x=.3;assert.equal(criterionRowsForScore(next,0,70).length,0);assert.equal(scoreMarkersForDraft(next,[70]).length,1);
});
test('identity selections validate, crop only chosen regions and address pages relative to each student',async()=>{
 const regions=key().identityRegions;assert.doesNotThrow(()=>validateIdentityRegions(regions));assert.throws(()=>validateIdentityRegions({number:[area('same'),area('same')]}));assert.throws(()=>validateIdentityRegions({email:[]}));
 const renders=[],draws=[],released=[];const source={render:async page=>{renders.push(page);const c={width:1000,height:1400};released.push(c);return c}};
 let n=0;const text=await readIdentityRegions(source,{start:5,end:6},regions,async()=>['Ayşe Yılmaz','123','9-A'][n++],{createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage:(...args)=>draws.push(args.slice(1))})})});
 assert.match(text,/Ad soyad: Ayşe Yılmaz/);assert.match(text,/Öğrenci numarası: 123/);assert.match(text,/Sınıf: 9-A/);assert.deepEqual(renders,[5,5,5]);assert.deepEqual(draws[0].slice(0,4),[100,140,400,210]);assert.ok(released.every(c=>c.width===0));
 await assert.rejects(readIdentityRegions(source,{start:5,end:5},{name:[area('next',{page:2})]},async()=>'',{}),/dışında/);
});
test('linked key and identity areas survive backup with final results unchanged',()=>{
 const k=key(),data={format:'sinav-asistani',version:1,classes:[{id:'c',name:'9-A',count:1,students:[{id:'s',number:'123',name:'Ayşe Yılmaz'}]}],exams:[{id:'e',name:'Sınav',subject:'Kimya',className:'9-A',type:'Klasik',questions:1,key:[{max:100,answer:'',visual:true}],visualKeys:[k],visualRubric:k,results:{s:[77]}}],papers:[{id:k.paperId,name:'key.png',type:'image/png',base64:'AAAA'}]};
 const restored=validateBackup(JSON.parse(JSON.stringify(data)));assert.deepEqual(restored.exams[0].visualRubric.identityRegions,k.identityRegions);assert.deepEqual(restored.exams[0].results.s,[77]);
 data.exams[0].visualRubric.regions[0][0].answerAreaIds=[];assert.throws(()=>validateBackup(data));
});
