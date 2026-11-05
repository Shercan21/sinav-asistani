import test from 'node:test';import assert from 'node:assert/strict';
import {mapIdentityRegions} from '../src/identity-alignment.mjs';
import {identifyPdfStudent} from '../src/pdf-student-identity.mjs';
const box={id:'n',page:1,x:.7,y:.07,width:.25,height:.03},regions={number:[box]},students=[{id:'a',number:'1234',name:'Ayşe Yılmaz'}];
test('identity registration maps only confident in-page rectangles and preserves source selections',()=>{
 const moved=mapIdentityRegions(regions,{1:{score:.9,dx:0,dy:-.025,scale:1}});assert.equal(moved.number[0].y,.045000000000000005);assert.equal(regions.number[0].y,.07);
 assert.deepEqual(mapIdentityRegions(regions,{1:{score:.4,dx:0,dy:-.025,scale:1}}),regions);assert.deepEqual(mapIdentityRegions(regions,{1:{score:.9,dx:.2,dy:0,scale:1}}),regions);
});
test('a failed aligned crop retains a student identified in the original teacher-selected rectangle',async()=>{
 const shifted=mapIdentityRegions(regions,{1:{score:.9,dx:0,dy:-.025,scale:1}});let reads=0;const source={render:async()=>({width:1000,height:1400}),headerText:()=>{throw Error('must stay inside selected regions')}};
 const r=await identifyPdfStudent({source,group:{start:3,end:4},regions:shifted,fallbackRegions:regions,students,className:'10-C',createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage(){}})}),readText:async()=>++reads===1?'boş':'1234'});
 assert.equal(r.match.studentId,'a');assert.equal(r.regionsUsed,regions);assert.equal(reads,2);
});
test('manually adjusted rectangles are authoritative and do not trigger an unrequested fallback',async()=>{
 let reads=0;const r=await identifyPdfStudent({source:{render:async()=>({width:1000,height:1400})},group:{start:1,end:2},regions,students,className:'10-C',createCanvas:()=>({width:0,height:0,getContext:()=>({drawImage(){}})}),readText:async()=>{reads++;return ''}});assert.equal(r.match.studentId,'');assert.equal(reads,1);
});
