import {withStudentEvidence} from './evidence-fixture.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {visualSearchRubric} from '../src/visual-search-scope.mjs';
import {gradeVisualRubric} from '../gemini-visual-server.mjs';
const zone={id:'answer',page:2,x:.1,y:.2,width:.8,height:.6},criterion={page:1,x:.7,y:.8,width:.1,height:.03,max:100,answerAreaIds:['answer']};
const input=()=>({comparison:'visual-rubric',consent:true,questions:1,maxima:[100],targets:[1],rubric:[{question:1,answerAreas:[zone],studentSearchAreas:[],regions:[criterion]}],studentImage:{mimeType:'image/png',base64:'iVBORw0KGgo='},keyImage:{mimeType:'image/png',base64:'iVBORw0KGgo='},closeups:[]});
test('a small criterion on another key page is reference only; the full linked answer area remains the search scope',()=>{
 const raw=input().rubric,plan=visualSearchRubric(raw),c=plan[0].criteria[0];assert.equal(c.reference.document,'answer-key');assert.equal(c.reference.area.page,1);assert.equal(c.search.document,'student');assert.deepEqual(c.search.answerAreaTemplates,[zone]);assert.equal(c.search.scope,'entire-linked-answer-areas');assert.equal(c.search.requireSamePosition,false);assert.deepEqual(c.search.locationHints,[]);assert.equal(raw[0].regions[0],criterion);
 const other={...zone,id:'other',page:3};raw[0].answerAreas.push(other);raw[0].regions.push({...criterion,max:20,answerAreaIds:['other']});const next=visualSearchRubric(raw);assert.deepEqual(next[0].criteria[0].search.answerAreaTemplates,[zone]);assert.deepEqual(next[0].criteria[1].search.answerAreaTemplates,[other]);
});
test('model request separates key references from whole-answer searches without sending real papers',async()=>{
 let called=false;await gradeVisualRubric(input(),{apiKey:'test-only',fetcher:withStudentEvidence(async(_url,options)=>{called=true;const body=JSON.parse(options.body),context=JSON.parse(body.contents[0].parts.find(p=>p.text?.startsWith('{')).text),c=context.rubric[0].criteria[0];assert.equal(c.reference.area.x,.7);assert.equal(c.search.answerAreaTemplates[0].x,.1);assert.equal(c.search.answerAreaTemplates[0].width,.8);assert.equal(c.search.requireSamePosition,false);assert.equal(context.rubric[0].regions,undefined);assert.match(context.instructions,/cevap alanının tamamında/);return{ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answers:[{question:1,regions:[{region:1,score:null,unclear:true,reason:'Öğretmen kontrolü gerekli.'}],studentAreas:[]}]})}]}}]})}})});assert.equal(called,true);
});
