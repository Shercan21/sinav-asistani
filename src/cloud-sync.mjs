import {cloud,accountConnection} from './cloud-client.mjs';
import {recordKey,accountId,paperDatabase} from './account-store.mjs';
import {listPapers,savePapers,deletePapers,toBase64,fromBase64} from './paper-store.mjs';
import {validateBackup} from './backup-data.mjs';

export function metadata() {
  return {classes:JSON.parse(localStorage.getItem(recordKey('sa_classes'))||'[]'),
    exams:JSON.parse(localStorage.getItem(recordKey('sa_exams'))||'[]')};
}
export const revisionKey = () => recordKey('sa_cloud_revision');
export const dirtyKey = () => recordKey('sa_cloud_dirty');
export async function snapshot() {
  return validateBackup({format:'sinav-asistani',version:1,createdAt:new Date().toISOString(),
    ...metadata(),papers:await Promise.all((await listPapers()).map(async([id,file])=>
      ({id,name:file.name,type:file.type,lastModified:file.lastModified,base64:await toBase64(file)})))});
}
export async function getRemote() {
  const {data,error}=await cloud.from('teacher_records').select('*').maybeSingle();
  if(error)throw error;return data;
}
const hash = async file => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await file.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
export async function pushSnapshot(userId,expected) {
  const connection=await accountConnection(userId);
  if(accountId()!==userId)throw new Error('Account changed');
  const data=await snapshot();
  const papers=[];
  for(const record of data.papers) {
    const file=fromBase64(record),digest=await hash(file),path=`${userId}/${digest}`;
    const {error}=await connection.storage.from('exam-papers').upload(path,file,{upsert:false,contentType:file.type});
    if(error&&String(error.statusCode)!=='409'&&error.message!=='The resource already exists')throw error;
    const {base64,...rest}=record;papers.push({...rest,path});
  }
  const {data:rows,error}=await connection.rpc('save_teacher_records',{expected_revision:expected,new_document:{...data,papers}});
  if(error)throw error;
  if(!rows?.[0])throw new Error('Bulut kaydı doğrulanamadı.');
  return rows[0];
}
export async function downloadSnapshot(row,userId) {
  const doc=row.document;
  if(!Array.isArray(doc?.papers))throw new Error('Bulut kaydı okunamadı.');
  const papers=[];
  for(const paper of doc.papers) {
    if(typeof paper.path!=='string'||!new RegExp(`^${userId}/[a-f0-9]{64}$`).test(paper.path))throw new Error('Kâğıt yolu doğrulanamadı.');
    const {data,error}=await cloud.storage.from('exam-papers').download(paper.path);if(error)throw error;
    if(data.size>15728640)throw new Error('Kâğıt boyutu sınırı aşıldı.');
    const file=new File([data],paper.name,{type:paper.type,lastModified:paper.lastModified});
    const digest=await hash(file);if(!paper.path.endsWith('/'+digest))throw new Error('Kâğıt bütünlüğü doğrulanamadı.');
    const {path,...rest}=paper;papers.push({...rest,base64:await toBase64(file)});
  }
  return validateBackup({...doc,papers});
}
export async function applySnapshot(data,revision) {
  const dbName=paperDatabase(),classesKey=recordKey('sa_classes'),examsKey=recordKey('sa_exams'),revKey=revisionKey();
  const previousPapers=await listPapers(dbName);
  const oldClasses=localStorage.getItem(classesKey),oldExams=localStorage.getItem(examsKey);
  const oldRevision=localStorage.getItem(revKey);
  try {
    await savePapers(data.papers.map(p=>[p.id,fromBase64(p)]),dbName);
    localStorage.setItem(classesKey,JSON.stringify(data.classes));
    localStorage.setItem(examsKey,JSON.stringify(data.exams));
    localStorage.setItem(revKey,String(revision));
  } catch(error) {
    for(const [key,value] of [[classesKey,oldClasses],[examsKey,oldExams]])value===null?localStorage.removeItem(key):localStorage.setItem(key,value);
    oldRevision===null?localStorage.removeItem(revKey):localStorage.setItem(revKey,oldRevision);
    await savePapers(previousPapers,dbName);
    const oldIds=new Set(previousPapers.map(([id])=>id));
    await deletePapers(data.papers.map(p=>p.id).filter(id=>!oldIds.has(id)),dbName);
    throw error;
  }
  const ids=new Set(data.papers.map(p=>p.id));
  await deletePapers((await listPapers(dbName)).map(([id])=>id).filter(id=>!ids.has(id)),dbName);
}
