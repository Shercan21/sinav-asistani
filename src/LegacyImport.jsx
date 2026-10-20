import React,{useState,useRef,useEffect} from 'react';
import {snapshot} from './cloud-sync.mjs';
import {listPapers,fromBase64,savePapers,toBase64} from './paper-store.mjs';
import {validateBackup,mergeBackup} from './backup-data.mjs';
import {recordKey,recordsChanged,accountId,paperDatabase} from './account-store.mjs';
import {syncControl} from './sync-control.mjs';

export default function LegacyImport({setClasses,setExams}) {
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 const live=useRef(true);useEffect(()=>()=>{live.current=false},[]);
 let count=0;try{count=JSON.parse(localStorage.getItem('sa_classes')||'[]').length}catch{}
 if(!count||done)return null;
 const transfer=async()=>{setBusy(true);setMessage('');const owner=accountId(),dbName=paperDatabase(),classesKey=recordKey('sa_classes'),examsKey=recordKey('sa_exams');syncControl.paused=true;try{
   const deadline=Date.now()+20000;while(syncControl.running){if(Date.now()>deadline)throw new Error('Eşitleme sürüyor. Biraz sonra tekrar deneyin.');await new Promise(resolve=>setTimeout(resolve,100))}
   if(!live.current||accountId()!==owner)throw new Error('Hesap değişti. İşlem durduruldu.');
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('sa_papers',1);r.onupgradeneeded=()=>r.result.createObjectStore('papers');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   let rows;try{rows=await new Promise((resolve,reject)=>{const rows=[];const r=db.transaction('papers').objectStore('papers').openCursor();r.onsuccess=()=>{const c=r.result;if(c){rows.push([c.key,c.value]);c.continue()}else resolve(rows)};r.onerror=()=>reject(r.error)})}finally{db.close()}
   const source=validateBackup({format:'sinav-asistani',version:1,createdAt:new Date().toISOString(),classes:JSON.parse(localStorage.getItem('sa_classes')||'[]'),exams:JSON.parse(localStorage.getItem('sa_exams')||'[]'),papers:await Promise.all(rows.map(async([id,f])=>({id,name:f.name,type:f.type,lastModified:f.lastModified,base64:await toBase64(f)})))});
   const merged=mergeBackup(await snapshot(),source);
   const url=URL.createObjectURL(new Blob([JSON.stringify(source)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`sinav-asistani-eski-kayitlar-${Date.now()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
   // Preserve original storage; merge rejects any changed record with the same ID.
   if(!live.current||accountId()!==owner)throw new Error('Hesap değişti. İşlem durduruldu.');
   await savePapers(merged.papers.map(p=>[p.id,fromBase64(p)]),dbName);
   const oldClasses=localStorage.getItem(classesKey),oldExams=localStorage.getItem(examsKey);
   try{localStorage.setItem(classesKey,JSON.stringify(merged.classes));localStorage.setItem(examsKey,JSON.stringify(merged.exams));}
   catch(error){for(const [key,value] of [[classesKey,oldClasses],[examsKey,oldExams]])value===null?localStorage.removeItem(key):localStorage.setItem(key,value);throw error}
   if(live.current&&accountId()===owner){setClasses(merged.classes);setExams(merged.exams);recordsChanged();setDone(true);}
 }catch(error){setMessage(error.message||'Aktarım tamamlanamadı. Eski kayıtlar korundu.')}finally{syncControl.paused=false;setBusy(false)}};
 return <section className="panel"><h3>Bu cihazdaki eski kayıtlar</h3><p>Önceki kullanımından {count} sınıf bu tarayıcıda duruyor. Telefonunda boş hesapla başlamış olsan da buradan aktarabilirsin.</p><p>Aktar düğmesi öğrenci adlarını, sınavları, notları ve kâğıtları giriş yaptığın hesaba ekler; ardından Supabase bulut alanına eşitlenir. Önceki kayıtlar korunur ve yedek dosyası hazırlanır. Farklı sürümler varsa işlem durdurulur.</p><button className="primary" disabled={busy} onClick={transfer}>{busy?'Aktarılıyor…':'Eski kayıtları bu hesabıma aktar'}</button>{message&&<p role="alert">{message}</p>}</section>;
}
