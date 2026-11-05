import test from 'node:test';import assert from 'node:assert/strict';
import {identityAreasOnPage,identifyPdfStudent} from '../src/pdf-student-identity.mjs';
const students=[{id:'right',number:'123',name:'Ayşe Yılmaz'},{id:'wrong',number:'999',name:'Ali Can'}];
const box=(id,page,x)=>({id,page,x,y:.6,width:.25,height:.1});
const regions={name:[box('name',1,.1)],number:[box('number',1,.4)],className:[box('class',2,.1)]};
const createCanvas=()=>({width:0,height:0,getContext:()=>({drawImage:()=>{}})});
test('selected identity regions override a conflicting printed header and respect each student relative pages',async()=>{
 const pages=[],source={headerText:async()=>{throw Error('must not read top of page')},render:async p=>{pages.push(p);return{width:1000,height:1400}}};let i=0;
 const result=await identifyPdfStudent({source,group:{start:4,end:5},regions,students,className:'10-C',createCanvas,readText:async()=>['Ayşe Yılmaz','123','10-C'][i++]});
 assert.equal(result.match.studentId,'right');assert.equal(result.selected,true);assert.deepEqual(pages,[4,4,5]);assert.deepEqual(identityAreasOnPage(regions,1).map(a=>a.field),['name','number']);assert.deepEqual(identityAreasOnPage(regions,2).map(a=>a.label),['Sınıf']);assert.deepEqual(identityAreasOnPage(regions,3),[]);
});
test('unread selected regions never trigger fallback to a different student in the header',async()=>{
 let headerCalls=0;const source={headerText:async()=>{headerCalls++;return 'Ali Can No 999'},render:async()=>({width:1000,height:1400})};
 const result=await identifyPdfStudent({source,group:{start:1,end:2},regions,students,className:'10-C',createCanvas,readText:async()=>''});assert.equal(result.match.studentId,'');assert.equal(headerCalls,0);assert.equal(result.selected,true);
});
test('keys without identity selection retain the original header behavior without loading the OCR engine',async()=>{
 const result=await identifyPdfStudent({source:{headerText:async()=> 'Ad soyad Ayşe Yılmaz No 123 Sınıf 10 C'},group:{start:1,end:2},students,className:'10-C',readText:async()=>{throw Error('unnecessary engine')}});assert.equal(result.match.studentId,'right');assert.equal(result.selected,false);
});
