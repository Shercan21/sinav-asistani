import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,realpath} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join,dirname,basename,resolve} from 'node:path';import {execFileSync} from 'node:child_process';import vm from 'node:vm';
test('service worker opens a known standalone HTML page, preserves the app fallback and leaves APIs alone',async()=>{
 const base=await realpath(tmpdir()),root=await mkdtemp(join(base,'sa-pwa-'));
 try{await writeFile(join(root,'index.html'),'APP');await writeFile(join(root,'eokul-aktarim-deneme.html'),'DEMO');execFileSync(process.execPath,[new URL('../scripts/build-pwa.mjs',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'),root]);const handlers={};vm.runInNewContext(await readFile(join(root,'sw.js'),'utf8'),{URL,self:{location:new URL('https://sample.test/app/sw.js'),addEventListener:(name,fn)=>handlers[name]=fn},caches:{match:async url=>url},fetch:()=>{throw Error('unexpected network')}});
 const navigate=async path=>{let result;handlers.fetch({request:{url:'https://sample.test'+path,method:'GET',mode:'navigate'},respondWith:value=>result=value});return await result;};
 assert.equal(await navigate('/app/eokul-aktarim-deneme.html'),'https://sample.test/app/eokul-aktarim-deneme.html');assert.equal(await navigate('/app/?utm_source=test'),'https://sample.test/app/index.html');assert.equal(await navigate('/app/unknown'),'https://sample.test/app/index.html');assert.equal(await navigate('/app/api/status'),undefined);
 }finally{if(resolve(dirname(root))!==resolve(base)||!basename(root).startsWith('sa-pwa-'))throw Error('Unsafe test cleanup');await rm(root,{recursive:true,force:true});}
});
