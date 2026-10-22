import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createApp} from '../server.mjs';
test('grading route requires session, correct origin and explicit consent; shares OCR throttle',async()=>{
  let clock=100000,calls=0,receivedKey='';const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
  server.on('request',createApp({password:'test-password-123',apiKey:'fake',origin,secure:false,now:()=>clock,grader:async(_input,options)=>{receivedKey=options.apiKey;calls++;return {answers:[]}}}));
  const request=(path,opts={})=>fetch(origin+path,{redirect:'manual',...opts});
  try{
    assert.equal((await request('/api/ocr/grade',{method:'POST'})).status,401);
    const loginPage=await request('/login'),cookie=loginPage.headers.get('set-cookie').split(';')[0],csrf=(await loginPage.text()).match(/name="csrf" value="([^"]+)"/)[1];
    const login=await request('/login',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({password:'test-password-123',csrf})});
    const opts={method:'POST',headers:{Cookie:login.headers.get('set-cookie').split(';')[0],Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({consent:false})};
    assert.equal((await request('/api/ocr/grade',{...opts,headers:{...opts.headers,Origin:'https://wrong.example'}})).status,403);
    assert.equal((await request('/api/ocr/grade',opts)).status,400);assert.equal(calls,0);clock+=6000;
    assert.equal((await request('/api/ocr/grade',{...opts,body:JSON.stringify({consent:true})})).status,200);assert.equal(calls,1);
    assert.equal((await request('/api/ocr',{...opts,body:JSON.stringify({consent:true})})).status,429);
    clock+=6000;const ownKey='AIza'+'a'.repeat(35);
    assert.equal((await request('/api/ocr/grade',{...opts,headers:{...opts.headers,'X-Gemini-Api-Key':ownKey},body:JSON.stringify({consent:true})})).status,200);assert.equal(receivedKey,ownKey);
    clock+=6000;assert.equal((await request('/api/ocr/grade',{...opts,headers:{...opts.headers,'X-Gemini-Api-Key':'bad'},body:JSON.stringify({consent:true})})).status,400);assert.equal(calls,2);
  }finally{await new Promise(r=>server.close(r))}
});
