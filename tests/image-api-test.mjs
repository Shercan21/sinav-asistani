import {test} from 'node:test';
import assert from 'node:assert/strict';
import {compareImagesWithGemini} from '../image-grading-server.mjs';
test('direct image grading sends both originals and no OCR text, preserves question numbering',async()=>{
 const input={comparison:'images',questions:1,examType:'Klasik',maxima:[100],targetQuestion:1,keyImage:{mimeType:'image/jpeg',base64:'/9j/AA=='},studentImage:{mimeType:'image/jpeg',base64:'/9j/AA=='}};
 let payload;
 const result=await compareImagesWithGemini(input,{apiKey:'test-only',fetcher:async(url,options)=>{payload=JSON.parse(options.body);return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({answers:[{question:1,score:100,unclear:false,reason:'Görsel ölçüt karşılandı.'}]})}]}}]})}}});
 assert.equal(payload.contents[0].parts.filter(p=>p.inlineData).length,2);assert.equal(JSON.stringify(payload).includes('studentAnswers'),false);assert.equal(result.answers[0].score,100);
 await assert.rejects(()=>compareImagesWithGemini({...input,studentImage:{mimeType:'image/jpeg',base64:'AAAA'}},{apiKey:'test'}),/biçimi/);
});

