import test from 'node:test';import assert from 'node:assert/strict';import {remainingPdfStudents,nextUnmatchedPdfGroup} from '../src/batch-pdf-review.mjs';
const groups=[{id:'a'},{id:'b'},{id:'c'}],students=[{id:'one'},{id:'two'},{id:'three'}];
test('automatic and manual selections disappear from other paper lists but remain visible on their own paper',()=>{
 const a={a:{studentId:'one'},b:{studentId:'two'}};assert.deepEqual(remainingPdfStudents(groups,a,students,'c').map(s=>s.id),['three']);assert.deepEqual(remainingPdfStudents(groups,a,students,'a').map(s=>s.id),['one','three']);a.b.studentId='three';assert.deepEqual(remainingPdfStudents(groups,a,students,'c').map(s=>s.id),['two']);assert.deepEqual(students.map(s=>s.id),['one','two','three']);
});
test('excluding a paper frees its student and next-unmatched navigation wraps without revisiting assigned papers',()=>{
 const a={a:{studentId:'one'},b:{studentId:'two',include:false}};assert.deepEqual(remainingPdfStudents(groups,a,students,'c').map(s=>s.id),['two','three']);assert.equal(nextUnmatchedPdfGroup(groups,a,'a')?.id,'c');a.a.studentId='';assert.equal(nextUnmatchedPdfGroup(groups,a,'c')?.id,'a');a.a.studentId='one';a.c={studentId:'three'};assert.equal(nextUnmatchedPdfGroup(groups,a,'a'),null);
});
