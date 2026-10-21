import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluationScores,retainScoreOnMarks} from '../src/visual-assessment.mjs';
import {toneFilter,applyPaperTone} from '../src/paper-tone.mjs';
test('previous ten plus newly confirmed five equals fifteen and reread does not duplicate',()=>{
 const d={manualScores:[10,20],marks:[],checked:[true,true]};
 const mark={question:1,score:5};const first=retainScoreOnMarks(d,[mark],0);
 assert.deepEqual(evaluationScores(first),[15,20]);
 assert.deepEqual(evaluationScores(retainScoreOnMarks(first,[mark],0)),[15,20]);
 const removed=retainScoreOnMarks(first,[],0);assert.deepEqual(evaluationScores(removed),[10,20]);
 assert.deepEqual(evaluationScores(retainScoreOnMarks(removed,[mark],0)),[15,20]);
 assert.equal(first.checked[1],true);
});
test('tone presets have safe original fallback and original does not process the source',async()=>{
 assert.equal(toneFilter('invalid'),'none');assert.match(toneFilter('dark'),/brightness/);
 assert.match(toneFilter('contrast'),/contrast/);assert.equal(await applyPaperTone('original-image'),'original-image');
});
