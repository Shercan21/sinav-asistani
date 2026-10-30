import {recordKey,accountId,recordsChanged} from './account-store.mjs';
import {listScanImages,writeScanImages} from './scan-store.mjs';
import {toBase64,fromBase64} from './paper-store.mjs';
import {emptySerial,normalizeOptical,validateScanArchive,mergeScanArchives,archiveHasData} from './scan-archive-data.mjs';
export const opticalKey=()=>recordKey('sa_optical_v1');
export const archiveReadyKey=()=>recordKey('sa_scan_archive_ready');
const read=(key,fallback)=>{const raw=localStorage.getItem(recordKey(key));return raw===null?fallback:JSON.parse(raw)};
export const loadOpticalCollection=()=>normalizeOptical(read('sa_optical_v1',null));
export const saveOpticalCollection=value=>{localStorage.setItem(opticalKey(),JSON.stringify(value));recordsChanged()};
export async function snapshotScanArchive(){
 const owner=accountId(),serial=read('sa_score_scan_v1',emptySerial()),optical=loadOpticalCollection(),refs=new Set([...serial.templates.map(t=>t.id),...serial.sessions.flatMap(s=>s.rows.map(r=>r.id))]),rows=await listScanImages(owner);
 if(accountId()!==owner)throw new Error('Hesap değişti.');
 const images=await Promise.all(rows.filter(([id])=>refs.has(id)).map(async([id,b])=>({id,name:`tarama-${id}.${b.type==='image/png'?'png':b.type==='image/webp'?'webp':'jpg'}`,type:b.type,lastModified:0,base64:await toBase64(b)})));
 return validateScanArchive({version:1,serial,optical,images});
}
export async function prepareScanApply(remote){
 const local=await snapshotScanArchive(),first=localStorage.getItem(archiveReadyKey())!=='1';
 if(!remote)return {archive:local,migrated:archiveHasData(local)};
 validateScanArchive(remote);
 if(first&&archiveHasData(local)){const merged=mergeScanArchives(remote,local);return {archive:merged,migrated:JSON.stringify(merged)!==JSON.stringify(remote)}}
 return {archive:remote,migrated:false};
}
export async function writeScanArchive(archive,owner=accountId(),rollback=false){
 validateScanArchive(archive);if(!rollback&&owner!==accountId())throw new Error('Hesap değişti.');const scoped=k=>owner?`${k}:${owner}`:k,keys=['sa_score_scan_v1','sa_optical_v1','sa_scan_archive_ready'].map(scoped),old=keys.map(k=>localStorage.getItem(k)),before=await listScanImages(owner),oldIds=new Set(before.map(([id])=>id));
 try{await writeScanImages(archive.images.map(p=>[p.id,fromBase64(p)]),[],owner);if(!rollback&&owner!==accountId())throw new Error('Hesap değişti.');localStorage.setItem(keys[0],JSON.stringify(archive.serial));localStorage.setItem(keys[1],JSON.stringify(archive.optical));localStorage.setItem(keys[2],'1')}
 catch(error){for(let i=0;i<keys.length;i++)old[i]===null?localStorage.removeItem(keys[i]):localStorage.setItem(keys[i],old[i]);await writeScanImages(before,archive.images.map(p=>p.id).filter(id=>!oldIds.has(id)),owner);throw error}
}
