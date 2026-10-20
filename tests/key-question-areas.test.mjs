import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keyQuestionAreas} from '../src/key-question-areas.mjs';
test('key crops follow actual key columns and retain labelled scoring corrections',()=>{
 const result=keyQuestionAreas([{page:1,lines:[{text:'1) Soru',x:.05,y:.2},{text:'2) Soru',x:.05,y:.7},{text:'3) Soru',x:.55,y:.45}]},{page:2,lines:[{text:'4) Soru',x:.05,y:.1},{text:'5) Soru',x:.05,y:.45},{text:'6) Soru',x:.55,y:.1},{text:'5. SORU PUAN DÜZELTMESİ:',x:.55,y:.6}]}],6);
 assert.equal(result[1].length,2);assert.equal(result[4].length,2);
 assert.equal(result[4][1].x,.49);assert.equal(result[4][1].page,2);
 assert.equal(result[5].length,1);assert.ok(result[5][0].y+result[5][0].height<.6);
});
test('a correction title never steals a missing question or a later real question',()=>{const a=keyQuestionAreas([{page:1,lines:[{text:'4) Soru',x:.05,y:.1},{text:'6) Soru',x:.55,y:.1},{text:'5. SORU PUAN DÜZELTMESİ:',x:.55,y:.6}]}],6);assert.equal(a[5].length,1);assert.equal(a[4].length,1);assert.equal(a[4][0].y,.585)});
test('page border before question five is not mistaken for part of its label',()=>{const a=keyQuestionAreas([{page:2,lines:[{text:'4) Soru',x:.1,y:.1},{text:'| 5) Aşağıda çözünme',x:.08,y:.43},{text:'6)',x:.54,y:.11},{text:'5. SORU PUAN DÜZELTMESİ:',x:.52,y:.53}]}],6);assert.equal(a[4].length,2);assert.equal(a[4][0].x,0);assert.equal(a[5].length,1)});

