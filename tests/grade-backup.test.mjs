import test from 'node:test';
import assert from 'node:assert/strict';
import {validateBackup} from '../src/backup-data.mjs';
const data=()=>({format:'sinav-asistani',version:1,classes:[{id:'c',name:'9-A',count:1,students:[{id:'s',number:'1',name:'Deneme'}]}],exams:[{id:'e',name:'Deneme',subject:'Türkçe',className:'9-A',type:'Klasik',questions:1,key:[{max:100,answer:'Ölçüt'}],readings:{s:{paperFingerprint:'a'.repeat(64),reviewed:true,reading:{fullText:'Yanıt',answers:[{question:1,text:'Yanıt',choice:'?',unclear:false}]},proposal:{context:'b'.repeat(64),answers:[{question:1,score:50,reason:'Kısmen karşılanmış.',unclear:false}]}}}}],papers:[]});
test('proposal survives backup without creating a final student grade',()=>{const saved=validateBackup(data());assert.equal(saved.exams[0].readings.s.proposal.answers[0].score,50);assert.equal(saved.exams[0].results,undefined)});
test('invalid proposal rejects backup while older records remain accepted',()=>{const old=data();delete old.exams[0].readings.s.proposal;assert.ok(validateBackup(old));for(const value of [-1,101,'50']){const bad=data();bad.exams[0].readings.s.proposal.answers[0].score=value;assert.throws(()=>validateBackup(bad))}});
