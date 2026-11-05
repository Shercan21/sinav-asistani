import test from 'node:test';import assert from 'node:assert/strict';import {readTeacherRecord} from '../src/cloud-record-read.mjs';
test('cloud record request uses the current user bearer and returns only one account document',async()=>{
 const base={url:'https://example.test',key:'publishable',token:'current-user'};const row={revision:3,document:{classes:[]}};
 const result=await readTeacherRecord({...base,fetcher:async(url,options)=>{assert.equal(url,'https://example.test/rest/v1/teacher_records?select=*');assert.equal(options.headers.Authorization,'Bearer current-user');return{ok:true,json:async()=>[row]}}});assert.deepEqual(result,row);
 assert.equal(await readTeacherRecord({...base,fetcher:async()=>({ok:true,json:async()=>[]})}),null);await assert.rejects(readTeacherRecord({...base,fetcher:async()=>({ok:true,json:async()=>[row,row]})}));await assert.rejects(readTeacherRecord({...base,fetcher:async()=>({ok:false,status:401})}),e=>e.code==='CLOUD_HTTP_401');
});
