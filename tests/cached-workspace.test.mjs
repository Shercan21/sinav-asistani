import test from 'node:test';import assert from 'node:assert/strict';import {canOpenCachedWorkspace,isConnectionFailure} from '../src/cached-workspace.mjs';
test('offline opening requires this account, a synced revision, explicit class/exam caches and valid complete snapshot',async()=>{
 const cache=new Map([['sa_cloud_revision:a','3'],['sa_classes:a','[]'],['sa_exams:a','[]']]),options={activeAccount:()=> 'a',storage:{getItem:key=>cache.get(key)??null},snapshot:async()=>({})};
 assert.equal(await canOpenCachedWorkspace('a',options),true);assert.equal(await canOpenCachedWorkspace('b',options),false);assert.equal(await canOpenCachedWorkspace('a',{...options,snapshot:async()=>{throw Error('invalid cached grade')}}),false);
 cache.delete('sa_exams:a');assert.equal(await canOpenCachedWorkspace('a',options),false);cache.set('sa_exams:a','[]');cache.set('sa_cloud_revision:a','0');assert.equal(await canOpenCachedWorkspace('a',options),false);
});
test('offline opening never treats authentication, validation or revision conflicts as network errors',()=>{
 for(const error of [{code:'CLOUD_TIMEOUT'},{name:'TimeoutError'},{message:'Failed to fetch'},{code:'CLOUD_HTTP_503'}])assert.equal(isConnectionFailure(error),true);
 for(const error of [{code:'CLOUD_VALIDATION'},{code:'CLOUD_HTTP_401'},{code:'40001'},{message:'Account changed'}])assert.equal(isConnectionFailure(error),false);
});
