import test from 'node:test';import assert from 'node:assert/strict';
import {verifiedCachedPaper,cloudReadDeadline} from '../src/cloud-download-cache.mjs';
test('cached cloud papers are reused only for the same account path, digest and type',async()=>{
 const paper={id:'e:s',path:'owner/'+ 'a'.repeat(64),type:'application/pdf'},file=new Blob(['example'],{type:'application/pdf'});let reads=0;const read=async()=>{reads++;return file};
 assert.equal(await verifiedCachedPaper(paper,'owner',read,async()=> 'a'.repeat(64)),file);
 assert.equal(await verifiedCachedPaper(paper,'owner',read,async()=> 'b'.repeat(64)),null);
 assert.equal(await verifiedCachedPaper({...paper,type:'image/png'},'owner',read,async()=> 'a'.repeat(64)),null);
 await assert.rejects(verifiedCachedPaper(paper,'other',read,async()=> 'a'.repeat(64)));assert.equal(reads,3);
 assert.equal(await verifiedCachedPaper(paper,'owner',async()=>null,async()=>{throw Error('not reached')}),null);
});
test('slow cloud reads terminate without changing data; normal results and original failures are preserved',async()=>{
 assert.equal(await cloudReadDeadline(async()=>42,100),42);await assert.rejects(cloudReadDeadline(async()=>{throw Error('original')},100),/original/);
 await assert.rejects(cloudReadDeadline(()=>new Promise(()=>{}),10),e=>e.code==='CLOUD_TIMEOUT');
});
