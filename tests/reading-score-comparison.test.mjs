import test from 'node:test';import assert from 'node:assert/strict';
import {compareReadingScores} from '../src/reading-score-comparison.mjs';import {proposalContext} from '../src/local-key-compare.mjs';
const fixture=()=>{const d={keySignature:'key',areas:[[],[],[]],manualScores:[99,99,99],reading:[0,1,2].map(()=>({status:'read',geminiAreas:[{max:10,score:5}]}))};d.reading.forEach((r,i)=>r.geminiContext=proposalContext(d,i));return d;};
test('compares genuine complete current proposals, without replacing saved scores or counting unknown as zero',()=>{
 const d=fixture();d.reading[1].geminiAreas[0].score='';d.reading[2].geminiContext='old';const saved=[7,8,9],before=JSON.stringify({d,saved});const result=compareReadingScores(d,[{max:10},{max:10},{max:10}],saved);
 assert.equal(result.rows[0].difference,-2);assert.equal(result.rows[1].proposed,null);assert.equal(result.rows[2].proposed,null);assert.equal(result.compared,1);assert.equal(result.averageDifference,2);assert.equal(JSON.stringify({d,saved}),before);
});
test('blank saved reference and failed readings are not real zero scores',()=>{const d=fixture();d.reading.forEach(r=>r.status='failed');const r=compareReadingScores(d,[{max:10},{max:10},{max:10}],['',0,undefined]);assert.equal(r.rows[0].saved,null);assert.equal(r.rows[1].saved,0);assert.equal(r.compared,0);assert.equal(r.averageDifference,null);});
