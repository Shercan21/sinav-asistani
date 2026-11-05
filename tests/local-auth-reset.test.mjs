import test from 'node:test';import assert from 'node:assert/strict';import {clearProjectLogin} from '../src/local-auth-reset.mjs';
test('login recovery removes only this project authentication cache, retaining grades and all other accounts',()=>{
 const ref='veoxuyxrvoytqwhtnfyh',base=`sb-${ref}-auth-token`,values=new Map([[base,'session'],[base+'-user','user'],['sa_classes:owner','classes'],['sa_exams:owner','grades'],['sb-other-auth-token','other session']]);
 clearProjectLogin({removeItem:key=>values.delete(key)},ref);assert.equal(values.has(base),false);assert.deepEqual([...values.values()],['classes','grades','other session']);assert.throws(()=>clearProjectLogin({removeItem:()=>{throw Error('should not clear')}},'invalid'));
});
