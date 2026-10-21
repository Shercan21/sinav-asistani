import React, { useState } from 'react';
import { parseRoster, validateKey, gradeExam, examResults } from './exam-data.mjs';
import './tools.css';

export function Roster({classroom, classes, setClasses, onClose, inform,onRequestDelete}) {
  const [number,setNumber]=useState(''), [name,setName]=useState(''), [bulk,setBulk]=useState(''), [error,setError]=useState('');
  const students=classroom.students||[];
  const [editingId,setEditingId]=useState(null);
  const cancelEdit=()=>{setEditingId(null);setNumber('');setName('');setError('')};
  const add=rows=>{
    const next=[...students,...rows.map(s=>({...s,id:crypto.randomUUID()}))];
    const count=Math.max(Number(classroom.count),next.length);
    if(classes.reduce((sum,c)=>sum+Number(c.id===classroom.id?count:c.count),0)>250) throw new Error('Toplam 250 öğrenci sınırı aşılacak.');
    setClasses(current=>current.map(c=>c.id===classroom.id?{...c,students:next,count}:c));
    setNumber('');setName('');setBulk('');setError('');inform('Öğrenci listesi kaydedildi.');
  };
  const submit=e=>{e.preventDefault();try{if(editingId){const [student]=parseRoster(`${number};${name}`,students.filter(s=>s.id!==editingId));setClasses(current=>current.map(c=>c.id===classroom.id?{...c,students:c.students.map(s=>s.id===editingId?{...s,...student}:s)}:c));cancelEdit();inform('Öğrenci bilgileri güncellendi.')}else add(parseRoster(`${number};${name}`,students))}catch(err){setError(err.message)}};
  return <div className="overlay"><section className="modal tool-modal" role="dialog" aria-modal="true" aria-label={`${classroom.name} öğrenci listesi`}><div className="tool-heading"><h2>{classroom.name} · Öğrenciler</h2><button className="secondary" onClick={onClose}>Kapat</button></div><p>{students.length} öğrencinin adı kayıtlı · Sınıf mevcudu: {classroom.count}</p><form onSubmit={submit} className="tool-inline"><label>Öğrenci numarası<input required value={number} onChange={e=>setNumber(e.target.value)} /></label><label>Ad soyad<input required value={name} onChange={e=>setName(e.target.value)}/></label><button className="primary">{editingId?'Değişiklikleri kaydet':'Öğrenci ekle'}</button>{editingId&&<button className="secondary" type="button" onClick={cancelEdit}>Düzenlemeden vazgeç</button>}</form>{editingId&&<div className="notice"><p>Seçili öğrenci: <strong>{students.find(s=>s.id===editingId)?.number} · {students.find(s=>s.id===editingId)?.name}</strong></p><button type="button" className="secondary" onClick={()=>onRequestDelete(editingId)}>Öğrenciyi sil</button><p>Silme işleminden önce yedek ve onay ekranı açılır.</p></div>}<details><summary>Listeyi toplu ekle</summary><p>Her satıra numara;ad soyad yazın. Excel’den iki sütunu kopyalayıp yapıştırabilirsiniz. Aynı numara ikinci kez eklenmez.</p><label>Öğrenci listesi<textarea rows="5" value={bulk} onChange={e=>setBulk(e.target.value)} placeholder={'101;Örnek Öğrenci\n102;Diğer Öğrenci'}/></label><button className="secondary" disabled={Boolean(editingId)} onClick={()=>{try{add(parseRoster(bulk,students))}catch(err){setError(err.message)}}}>Listeyi ekle</button></details>{error&&<p className="tool-error" role="alert">{error}</p>}<div className="table-scroll"><table><thead><tr><th>Numara</th><th>Ad soyad</th><th>İşlem</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td>{s.number}</td><td>{s.name}</td><td><button type="button" className="secondary" aria-label={`${s.number} numaralı öğrenciyi düzenle`} onClick={()=>{setEditingId(s.id);setNumber(s.number);setName(s.name);setError('')}}>Düzenle</button></td></tr>)}</tbody></table></div>{!students.length&&<p>Henüz isim listesi eklenmedi. Sınıf mevcudunuz korunuyor; öğrencileri ekledikçe isim listesi dolacak.</p>}</section></div>;
}

export {default as ExamWorkspace} from './UnifiedExamWorkspace.jsx';

export function Reports({exams,classes}) {
  const [examId,setExamId]=useState('');
  const exam=exams.find(e=>e.id===examId), classroom=classes.find(c=>c.name===exam?.className);
  const rows=exam?examResults(exam,classroom?.students||[]):[];
  const graded=rows.filter(row=>row.score!==null), avg=graded.length?Math.round(graded.reduce((sum,r)=>sum+r.score,0)/graded.length*100)/100:null;
  return <section className="panel report-panel"><h3>Sınav sonuç raporu</h3><label>Raporlanacak sınav<select value={examId} onChange={e=>setExamId(e.target.value)}><option value="">Sınav seçin</option>{exams.map(e=><option key={e.id} value={e.id}>{e.name} · {e.className} · {e.subject}</option>)}</select></label>{exam?<><h3>{exam.name} · {exam.className} · {exam.subject}</h3><div className="report-summary"><span>Sonucu girilen: <strong>{graded.length} / {rows.length}</strong></span><span>Ortalama: <strong>{avg??'—'}</strong></span></div><p>Sınıf mevcudu {classroom?.count??0}; isim listesinde {rows.length} öğrenci var. Sonucu girilmeyenler ortalamaya katılmaz.</p><div className="table-scroll"><table><thead><tr><th>Numara</th><th>Ad soyad</th><th>Puan / 100</th><th>Durum</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{row.number}</td><td>{row.name}</td><td>{row.score??'—'}</td><td>{row.score===null?'Sonuç girilmedi':'Kaydedildi'}</td></tr>)}</tbody></table></div>{!rows.length&&<p>Bu sınıfın isim listesi henüz eklenmedi.</p>}<button className="secondary no-print" onClick={()=>window.print()}>Yazdır / PDF olarak kaydet</button></>:<p>Sınıfın not çizelgesini görmek için sınav seçin.</p>}</section>;
}
