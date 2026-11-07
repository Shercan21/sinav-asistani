import test from 'node:test';
import assert from 'node:assert/strict';
import {hasCurrentSavedReading} from '../src/saved-class-reading.mjs';
test('completed reading survives teacher area correction but changed paper or key does not',()=>{
 const draft={paperFingerprint:'paper',keySignature:'key',areas:[[]],reading:[{provider:'gemini',geminiAreas:[{score:10}],geminiContext:'earlier-area'}]};
 assert.equal(hasCurrentSavedReading(draft,'paper','key',1),true);
 assert.equal(hasCurrentSavedReading(draft,'new-paper','key',1),false);
 assert.equal(hasCurrentSavedReading(draft,'paper','new-key',1),false);
 assert.equal(hasCurrentSavedReading(draft,'paper','key',2),false);
});
