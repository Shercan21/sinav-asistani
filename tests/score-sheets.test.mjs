import test from 'node:test';
import assert from 'node:assert/strict';
import {saveScoreSheet,validateScoreSheets,compareSheets,sourceRows} from '../src/score-sheets.mjs';
import {scoreTableRows,updateScoreTable,transferPayload} from '../src/score-transfer.mjs';
const students=[{id:'s1',number:'1001',name:'Örnek Öğrenci'}];
const exam={id:'e1',className:'Örnek',name:'Deneme',subject:'Kimya',type:'Klasik',questions:2,key:[{max:10,visual:true},{max:10,visual:true}],results:{s1:[8,9]},scoreTables:{version:1,manual:{}}};
const rows=scores=>{const row=scoreTableRows(exam,students,'manual')[0];return updateScoreTable(exam,'manual',row,{scores,checked:true}).scoreTables.manual;};
test('deleting and restoring a list preserves its points and legacy visibility',()=>{const sheet={id:'a',name:'Liste',rows:rows([5,6])};let state=saveScoreSheet({...exam,scoreSheets:{version:1,tables:[],legacyHidden:true}},sheet);state=saveScoreSheet(state,{...sheet,deleted:true});validateScoreSheets(state.scoreSheets,students);assert.equal(state.scoreSheets.legacyHidden,true);assert.deepEqual(state.results,exam.results);state=saveScoreSheet(state,{...state.scoreSheets.tables[0],deleted:false});assert.deepEqual(state.scoreSheets.tables[0].rows,sheet.rows);});
test('blank sheets preserve saved results and legacy tables; sheets stay independent',()=>{const first=saveScoreSheet(exam,{id:'a',name:'Boş',rows:{}});const second=saveScoreSheet(first,{id:'b',name:'Dolu',rows:rows([5,6])});assert.deepEqual(second.results,exam.results);assert.deepEqual(second.scoreTables,exam.scoreTables);assert.deepEqual(second.scoreSheets.tables[0].rows,{});validateScoreSheets(second.scoreSheets,students);});
test('Gemini source uses saved final scores without modifying source or approval',()=>{const source=sourceRows(exam,students);assert.deepEqual(source.s1.scores,[8,9]);assert.equal(source.s1.checked,false);assert.deepEqual(exam.results.s1,[8,9]);});
test('comparison preserves unknown values and does not alter sources',()=>{const a={id:'a',name:'A',rows:rows([null,0])},b={id:'b',name:'B',rows:rows([5,0])};const before=JSON.stringify([a,b]);assert.deepEqual(compareSheets(exam,students,a,b)[0].differences,[null,0]);assert.equal(JSON.stringify([a,b]),before);});
test('named list can use existing official transfer format',()=>{const list=rows([5,6]);const result=scoreTableRows({...exam,scoreTables:{manual:list}},students,'manual');assert.equal(transferPayload(exam,result,'manual').students[0].total,11);assert.throws(()=>validateScoreSheets({version:1,tables:[{id:'a',name:'',rows:{}}]},students));});

