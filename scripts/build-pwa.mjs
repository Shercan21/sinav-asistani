import {readdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const root=process.argv[2]||'dist';
async function walk(directory,prefix=''){const files=[];for(const entry of await readdir(directory,{withFileTypes:true})){const name=prefix+entry.name;if(entry.isDirectory())files.push(...await walk(join(directory,entry.name),name+'/'));else if(!name.endsWith('.map')&&name!=='sw.js')files.push(name)}return files}
const files=await walk(root),hash=createHash('sha256');for(const file of files)hash.update(await readFile(join(root,file)));
const version=hash.digest('hex').slice(0,16);
const worker=`const CACHE='sa-static-${version}';const FILES=${JSON.stringify(files)};const ROOT=new URL('./',self.location).href;self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES.map(file=>new URL(file,ROOT).href)))));self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING')self.skipWaiting()});self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sa-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/'))return;if(event.request.mode==='navigate'){event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('index.html',ROOT).href)));return}if(FILES.some(file=>new URL(file,ROOT).pathname===url.pathname))event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)))});`;
await writeFile(join(root,'sw.js'),worker);
console.log(`PWA hazır: ${files.length} uygulama dosyası.`);
