import test from 'node:test';
import assert from 'node:assert/strict';
import {evidenceText,containsEvidenceQuote} from '../src/evidence-text.mjs';
import {corroborateStudentEvidence,groundVisualScores} from '../student-evidence-server.mjs';
const o={id:'a',question:1,kind:'writing',text:'6,02 × 10²³',page:1,x:.1,y:.1,width:.4,height:.2};
test('notation equivalence preserves scientific values and charges',()=>{
 for(const [a,b] of [['10²³','10^23'],['10²³','10^{23}'],['6,02 × 10²³','6.02.10^23'],['H₂O','H2O'],['OH⁻','OH^-'],['SO₄²⁻','SO4^2-'],['2 + 3 = 5','2+3=5']])assert.equal(evidenceText(a),evidenceText(b),a);
 for(const [a,b] of [['10²³','1023'],['H₂O','H₂O₂'],['OH⁻','OH'],['Fe²⁺','Fe³⁺'],['6,02','60,2'],['1 7','17'],['CO','Co'],['islem','işlem']])assert.notEqual(evidenceText(a),evidenceText(b),a);
 assert.equal(corroborateStudentEvidence([o],[{...o,text:'6.02.10^23'}])[0].verified,true);
 assert.equal(corroborateStudentEvidence([o],[{...o,text:'6.02.10^22'}])[0].verified,false);
});
test('quotes cannot silently lose an exponent or cut a number out of a larger number',()=>{
 assert.equal(containsEvidenceQuote('10²³ molekül','1023 molekül'),false);
 assert.equal(containsEvidenceQuote('117 akb','17 akb'),false);
 assert.equal(containsEvidenceQuote('Sonuç 6,02 × 10²³ tane','6.02.10^23'),true);
});
test('subparts cannot corroborate or justify one another',()=>{
 assert.equal(corroborateStudentEvidence([{...o,subpart:'a'}],[{...o,subpart:'b'}])[0].verified,false);
 const result=groundVisualScores({answers:[{question:1,regions:[{region:1,score:4,guidanceConflict:false,evidenceId:'a',studentQuote:o.text}]}]},[{...o,subpart:'b',verified:true}],{rubric:[{question:1,regions:[{label:'a) yöntem'}]}]});
 assert.equal(result.answers[0].regions[0].score,null);
});
