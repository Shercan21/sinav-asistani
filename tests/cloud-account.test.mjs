import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createApp} from '../server.mjs';
import {selectAccount,recordKey,paperDatabase} from '../src/account-store.mjs';
test('account caches and papers never use another account or legacy keys',()=>{
 selectAccount('first');const a=[recordKey('sa_classes'),recordKey('sa_exams'),paperDatabase()];
 selectAccount('second');const b=[recordKey('sa_classes'),recordKey('sa_exams'),paperDatabase()];
 assert.equal(a.some(x=>b.includes(x)),false);
 selectAccount('');assert.equal(recordKey('sa_classes'),'sa_classes');assert.equal(paperDatabase(),'sa_papers');
 assert.equal(a.includes('sa_classes'),false);
});
test('personal mode exposes only app shell; Gemini requires personal authentication even with legacy cookie',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'sa-account-'));await writeFile(join(dir,'index.html'),'<h1>Public app shell</h1>');
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 server.on('request',createApp({origin,dist:dir,personalAuth:true,secure:false}));
 try{
  assert.equal((await fetch(origin)).status,200);
  assert.equal((await fetch(origin+'/login',{redirect:'manual'})).status,303);
  for(const path of ['/api/ocr/status','/api/ocr','/api/ocr/grade']){
   const r=await fetch(origin+path,{method:path.endsWith('status')?'GET':'POST',headers:{Cookie:'sa_session=legacy'}});
   assert.equal(r.status,401);
  }
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true})}
});
