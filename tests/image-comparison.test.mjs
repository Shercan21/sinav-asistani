import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateImageComparison,normalizeImageComparison} from '../src/image-comparison.mjs';
const input=()=>({comparison:'images',questions:2,examType:'Klasik',maxima:[40,60],targetQuestion:2,keyImage:{mimeType:'image/jpeg',base64:'/9j/AA=='},studentImage:{mimeType:'image/jpeg',base64:'/9j/AA=='}});
test('image comparison uses approved maxima and rejects mixed or missing documents',()=>{assert.ok(validateImageComparison(input()));for(const change of [{targetQuestion:3},{maxima:[40,50]},{keyImage:null}])assert.throws(()=>validateImageComparison({...input(),...change}))});
test('image result keeps genuine uncertainty and validates the exact target and score range',()=>{const row={question:2,score:60,reason:'Görsel rubrik karşılandı.',unclear:false};assert.equal(normalizeImageComparison({answers:[row]},input()).answers[0].score,60);assert.equal(normalizeImageComparison({answers:[{...row,unclear:true}]},input()).answers[0].score,null);for(const change of [{question:1},{score:61},{score:'60'}])assert.throws(()=>normalizeImageComparison({answers:[{...row,...change}]},input()))});

