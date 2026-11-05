import test from 'node:test';import assert from 'node:assert/strict';import {createSessionAccess} from '../src/cloud-session.mjs';
const session=(id,token,expires_at=200)=>({user:{id},access_token:token,expires_at});
test('valid cloud session avoids repeated auth locks and never exposes a token to another account',async()=>{
 let refreshes=0;const access=createSessionAccess(async()=>{refreshes++;throw Error('unexpected')},()=>100000);access.remember(session('a','token-a'));assert.equal(await access.token('a'),'token-a');assert.equal(refreshes,0);await assert.rejects(access.token('b'));access.remember(null);await assert.rejects(access.token('a'));
});
test('expired cloud sessions refresh and account changes during refresh cannot return the former token',async()=>{
 const access=createSessionAccess(async()=>session('a','new'),()=>100000);access.remember(session('a','old',101));assert.equal(await access.token('a'),'new');
 let done;const changing=createSessionAccess(()=>new Promise(r=>done=r),()=>100000);changing.remember(session('a','old',101));const request=changing.token('a');changing.remember(session('b','other'));done(session('a','new'));await assert.rejects(request,/Account changed/);
});
