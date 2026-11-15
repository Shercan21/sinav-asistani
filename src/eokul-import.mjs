// This collector runs only when the teacher clicks their bookmark on e-Okul.
// It reads rendered table/input values. No requests, setters, or form submission.
export function collectEokulSnapshot(doc,loc,now=new Date()){
 if(loc.protocol!=='https:'||loc.hostname!=='e-okul.meb.gov.tr')throw Error('Bu araç yalnız e-okul.meb.gov.tr not giriş ekranında çalışır.');
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim(),lower=s=>clean(s).toLocaleLowerCase('tr-TR');
 const value=cell=>{if(!cell)return '';const inputs=Array.from(cell.querySelectorAll('input:not([type="hidden"])'));if(inputs.length>1)throw Error('Bir puan hücresinde birden fazla alan var; veri alınmadı.');return clean(inputs.length?inputs[0].value:cell.textContent);};
 const number=s=>{if(!s)return null;if(!/^\d+(?:[.,]\d{1,2})?$/.test(s))throw Error('Sayısal puan okunamadı: '+s.slice(0,40));return Number(s.replace(',','.'));};
 const status=s=>{const t=lower(s);return /girmedi/.test(t)?'Girmedi':/muaf/.test(t)?'Muaf':/kopya/.test(t)?'Kopya':/girdi/.test(t)?'Girdi':null;};
 const candidates=[];
 for(const table of doc.querySelectorAll('table')){
  if(table.getClientRects&&table.getClientRects().length===0)continue;
  const all=Array.from(table.rows||[]);for(let h=0;h<all.length;h++){
   const headers=Array.from(all[h].cells||[]).map(c=>lower(c.textContent));
   const school=headers.findIndex(t=>/okul\s*(no|numara)/.test(t)),name=headers.findIndex(t=>/ad[ıi].*soyad|öğrenci.*ad/.test(t));
   const questions=headers.flatMap((t,index)=>{const m=t.match(/^(\d+)\.\s*(?:soru\s*)?\(\s*(\d+(?:[.,]\d+)?)\s*(?:puan)?\s*\)/);return m?[{index,question:Number(m[1]),max:Number(m[2].replace(',','.'))}]:[];});
   if(school<0||name<0||!questions.length)continue;
   const total=headers.findIndex(t=>/^toplam/.test(t)),participation=headers.findIndex(t=>/^katılım/.test(t));
   const students=[];
   for(const row of all.slice(h+1)){const cells=Array.from(row.cells||[]),id=value(cells[school]);if(!/^\d{1,15}$/.test(id))continue;
    const choice=cells[participation]?.querySelector('select'),label=choice?choice.selectedOptions?.[0]?.textContent||choice.value:value(cells[participation]);
    students.push({number:id,name:value(cells[name]),scores:questions.map(q=>number(value(cells[q.index]))),reportedTotal:number(value(cells[total])),status:status(label)});
   }
   if(students.length)candidates.push({questions,students});break;
  }
 }
 candidates.sort((a,b)=>b.questions.length-a.questions.length||b.students.length-a.students.length);
 if(!candidates.length)throw Error('Soru puanları ve okul numarası olan tablo bulunamadı. Not giriş listesini açın.');
 if(candidates.length>1&&candidates[0].questions.length===candidates[1].questions.length&&candidates[0].students.length===candidates[1].students.length)throw Error('Birden fazla not tablosu var; hangi listenin alınacağı belirsiz.');
 const result=candidates[0];if(result.questions.some((q,i)=>q.question!==i+1))throw Error('Soru sırası doğrulanamadı; veri alınmadı.');
 const count=clean(doc.body?.innerText).match(/(\d+)\s*öğrenci\s*\/\s*(\d+)\s*soru/i);
 return {format:'sinav-asistani-eokul-snapshot',version:1,sourceUrl:loc.origin+loc.pathname,capturedAt:now.toISOString(),questionMaxima:result.questions.map(q=>q.max),...(count?{expectedStudents:Number(count[1])}:{}),students:result.students};
}
export function eokulReadBookmark(){
 const code=`(()=>{try{const data=(${collectEokulSnapshot.toString()})(document,location);const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='e-Okul-notlari.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);alert(data.students.length+' öğrenci okundu. e-Okul alanları değiştirilmedi. Dosyayı Sınav Asistanı içindeki e-Okul’dan not al bölümünde açın.')}catch(e){alert(e.message)}})();`;
 return 'javascript:'+encodeURIComponent(code);
}
export function validateEokulSnapshot(data){
 if(!data||data.format!=='sinav-asistani-eokul-snapshot'||data.version!==1||!Array.isArray(data.questionMaxima)||!data.questionMaxima.length||data.questionMaxima.length>200||data.questionMaxima.some(n=>!Number.isFinite(n)||n<=0||n>100)||!Array.isArray(data.students)||!data.students.length||data.students.length>250)throw Error('e-Okul okuma dosyası geçersiz.');
 const ids=new Set();for(const r of data.students){if(!r||typeof r.number!=='string'||!/^\d{1,15}$/.test(r.number)||ids.has(r.number)||typeof r.name!=='string'||!r.name.trim()||r.name.length>200||!Array.isArray(r.scores)||r.scores.length!==data.questionMaxima.length||r.scores.some((v,i)=>v!==null&&(!Number.isFinite(v)||v<0||v>data.questionMaxima[i]))||(r.reportedTotal!==null&&(!Number.isFinite(r.reportedTotal)||r.reportedTotal<0||r.reportedTotal>100))||![null,'Girdi','Girmedi','Muaf','Kopya'].includes(r.status))throw Error('e-Okul öğrenci satırları geçersiz.');ids.add(r.number);}
 if(data.expectedStudents!==undefined&&(!Number.isInteger(data.expectedStudents)||data.expectedStudents<data.students.length||data.expectedStudents>250))throw Error('Öğrenci sayısı doğrulanamadı.');return data;
}
export function previewEokulImport(data,exam,students){
 validateEokulSnapshot(data);const maxima=exam.key?.map(q=>Number(q.max))||[];
 const compatible=maxima.length===data.questionMaxima.length&&maxima.every((n,i)=>Math.abs(n-data.questionMaxima[i])<.001);
 return {compatible,partial:!!data.expectedStudents&&data.expectedStudents>data.students.length,rows:data.students.map(r=>{
  const matches=students.filter(s=>String(s.number)===r.number),student=matches.length===1?matches[0]:null,issues=[];
  if(!compatible)issues.push('Soru sayısı veya üst puanları seçili sınavla eşleşmiyor.');if(!student)issues.push('Okul numarası seçili sınıfta tek bir öğrenciyle eşleşmedi.');
  if(student&&student.name.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ')!==r.name.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' '))issues.push('Numara eşleşti ama ad soyad farklı; kontrol gerekli.');
  if(r.status===null)issues.push('Katılım durumu seçilmemiş.');
  if(r.status==='Girdi'&&r.scores.some(v=>v===null))issues.push('Soru puanları eksik; toplamdan dağıtılmadı.');
  if(r.status==='Girdi'&&r.scores.every(v=>v!==null)&&r.reportedTotal!==null&&Math.abs(r.scores.reduce((a,b)=>a+b,0)-r.reportedTotal)>.01)issues.push('Soru puanlarının toplamı ekrandaki toplamla uyuşmuyor.');
  return {...r,studentId:student?.id,issues};
 })};
}
