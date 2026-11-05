import test from 'node:test';import assert from 'node:assert/strict';
import {parseCriterionAlternatives,validateCriterionAlternatives,studentComparisonAreas} from '../src/criterion-alternatives.mjs';
import {visualSearchRubric} from '../src/visual-search-scope.mjs';
import {validateVisualKey,visualSignature} from '../src/visual-assessment.mjs';
import {validateBackup} from '../src/backup-data.mjs';import {cloneRubricSelections} from '../src/rubric-links.mjs';
import {validateGeminiVisual} from '../src/gemini-visual-data.mjs';
const area=(id,extra={})=>({id,page:1,x:.1,y:.2,width:.5,height:.1,...extra});
const key=()=>({id:'k',name:'Anahtar',questions:1,paperId:'e:__key_k__',paperFingerprint:'a'.repeat(64),answerRegions:[[area('answer')]],regions:[[area('criterion',{max:100,answerAreaIds:['answer'],alternatives:['çökelti oluşumu','çökelek oluşumu']})]]});
test('alternatives preserve Turkish phrases, deduplicate lines and reject invalid lists',()=>{
 assert.deepEqual(parseCriterionAlternatives(' çökelti oluşumu\n\nÇÖKELTİ OLUŞUMU\nçökelek oluşumu\n'),['çökelti oluşumu','çökelek oluşumu']);assert.deepEqual(parseCriterionAlternatives(''),[]);assert.doesNotThrow(()=>validateCriterionAlternatives(undefined));for(const value of ['text',[12],[''],Array(21).fill('a'),['a'.repeat(201)]])assert.throws(()=>validateCriterionAlternatives(value));
});
test('alternatives survive key cloning and backup, remain scoped to the criterion, and change the reading signature',async()=>{
 const k=key();validateVisualKey(k,1);const clone=cloneRubricSelections(k,(()=>{let i=0;return()=>`new-${++i}`})());assert.deepEqual(clone.regions[0][0].alternatives,k.regions[0][0].alternatives);
 const data={format:'sinav-asistani',version:1,classes:[{id:'c',name:'10-C',count:1,students:[{id:'s',name:'Örnek Öğrenci',number:'123'}]}],exams:[{id:'e',name:'Sınav',subject:'Kimya',className:'10-C',type:'Klasik',questions:1,key:[{max:100,answer:'',visual:true}],visualKeys:[k],visualRubric:k,results:{s:[70]}}],papers:[]};const copy=validateBackup(JSON.parse(JSON.stringify(data)));assert.deepEqual(copy.exams[0].visualRubric.regions[0][0].alternatives,k.regions[0][0].alternatives);assert.deepEqual(copy.exams[0].results.s,[70]);
 const maxima=[{max:100}],before=await visualSignature(maxima,k);k.regions[0][0].alternatives.push('katı meydana gelmesi');assert.notEqual(await visualSignature(maxima,k),before);
 const rubric=[{question:1,answerAreas:k.answerRegions[0],regions:k.regions[0]}],plan=visualSearchRubric(rubric);assert.deepEqual(plan[0].criteria[0].acceptableAlternatives,k.regions[0][0].alternatives);assert.equal(plan[0].criteria[0].search.scope,'entire-linked-answer-areas');
 const image={mimeType:'image/png',base64:'iVBORw0KGgo='},input={comparison:'visual-rubric',consent:true,questions:1,maxima:[100],targets:[1],rubric,studentImage:image,keyImage:image};assert.doesNotThrow(()=>validateGeminiVisual(input));rubric[0].regions[0].alternatives=[false];assert.throws(()=>validateGeminiVisual(input));
});
test('student comparison joins selected fragments of one answer into a full crop without mixing pages or linked areas',()=>{
 const a=area('a',{answerAreaId:'answer',height:.04}),b=area('b',{answerAreaId:'answer',y:.3,height:.04}),other=area('c',{answerAreaId:'other',x:.7,width:.2}),next=area('d',{page:2});const source=[a,b,other,next],copy=structuredClone(source),view=studentComparisonAreas(source);assert.equal(view.length,3);assert.equal(view[0].y,.2);assert.ok(Math.abs(view[0].height-.14)<1e-8);assert.deepEqual(source,copy);assert.equal(view[1],other);assert.equal(view[2],next);
});
