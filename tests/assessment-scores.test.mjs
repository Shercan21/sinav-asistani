import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scoreSummary,assessmentScoreMarks} from '../src/assessment-scores.mjs';
test('decimal scores sum without rounding drift and blank differs from zero',()=>{
 const key=Array.from({length:4},()=>({max:2.5}));
 assert.deepEqual(scoreSummary([2.5,2.5,0,''],key),{total:5,max:10,completed:3,invalid:false});
 assert.equal(scoreSummary([.1,.2,0,0],key).total,.3);
 assert.equal(scoreSummary([3,0,0,0],key).invalid,true);
});
test('PDF places marks on matching pages and retains zero and decimal grades',()=>{
 const marks=assessmentScoreMarks([0,2.5],[{max:5},{max:5}],[[{page:2,x:.49,y:.3}],[]]);
 assert.equal(marks[1].page,2);assert.equal(marks[1].text,'S1: 0 / 5');
 assert.equal(marks[2].page,1);assert.match(marks[2].text,/2,5/);
 assert.throws(()=>assessmentScoreMarks([''],[{max:5}],[[]]));
});

