import {collectEokulSnapshot} from './eokul-import.mjs';
export function validateEokulTransfer(data){
 const fail=()=>{throw Error('Aktarım dosyası geçersiz veya eksik.');};
 if(!data||data.format!=='sinav-asistani-eokul'||data.version!==1||!['manual','gemini'].includes(data.source)||!data.exam||!['className','name','subject'].every(k=>typeof data.exam[k]==='string'&&data.exam[k].trim()&&data.exam[k].length<=1000)||!Array.isArray(data.exam.maxima)||!data.exam.maxima.length||data.exam.maxima.length>200||data.exam.maxima.some(n=>!Number.isFinite(n)||n<=0||n>100)||data.exam.maxima.reduce((a,b)=>a+b,0)>100.001||!Array.isArray(data.students)||!data.students.length||data.students.length>250)fail();
 const ids=new Set();for(const s of data.students){if(!s||typeof s.number!=='string'||!/^\d{1,15}$/.test(s.number)||ids.has(s.number)||typeof s.name!=='string'||!s.name.trim()||s.name.length>200||!['Sınava Girdi','Sınava Girmedi','Muaf','Kopya'].includes(s.participation)||!Array.isArray(s.scores)||s.scores.length!==data.exam.maxima.length)fail();ids.add(s.number);if(s.participation==='Muaf'){if(s.total!==null||s.scores.some(n=>n!==null))fail();}else{if(s.scores.some((n,i)=>!Number.isFinite(n)||n<0||n>data.exam.maxima[i]||(s.participation!=='Sınava Girdi'&&n!==0))||!Number.isFinite(s.total)||Math.abs(s.scores.reduce((a,b)=>a+b,0)-s.total)>.001)fail();}}
 return data;
}
export function planEokulFill(snapshot,targets,data){
 validateEokulTransfer(data);
 const canonical=s=>String(s||'').replace(/\s+/g,' ').trim().toLocaleLowerCase('tr-TR');
 const status=s=>{const t=canonical(s);return t.includes('girmedi')?'Girmedi':t.includes('muaf')?'Muaf':t.includes('kopya')?'Kopya':t.includes('girdi')?'Girdi':null;};
 if(snapshot.questionMaxima.length!==data.exam.maxima.length||snapshot.questionMaxima.some((n,i)=>Math.abs(n-data.exam.maxima[i])>.001))throw Error('Soru sayısı, sırası veya üst puanları eşleşmiyor. Hiçbir alan doldurulmadı.');
 if(new Set(snapshot.students.map(s=>s.number)).size!==snapshot.students.length)throw Error('Ekranda yinelenen öğrenci numarası var.');
 const operations=[],rows=[];
 for(const source of data.students){
  const current=snapshot.students.find(s=>s.number===source.number),target=targets.find(t=>t.number===source.number);
  if(!current||!target)throw Error(source.number+' numaralı öğrenci ekranda bulunamadı. Doğru sınıfı/sayfayı açın.');
  if(canonical(current.name)!==canonical(source.name))throw Error(source.number+' numarada ad soyad eşleşmiyor.');
  if(source.participation!=='Muaf')for(let i=0;i<source.scores.length;i++){
   if(current.scores[i]===source.scores[i])continue;
   const node=target.scoreInputs[i];
   if(!node||node.disabled||node.readOnly||!['','text','number','tel'].includes(node.type||'')||node.isConnected===false)throw Error(source.number+' · '+(i+1)+'. sorunun kutusu düzenlenemiyor. Kilitli alanlar aşılmadı. Katılımı veya sınav ekranını kontrol edin.');
   const old=String(node.value);operations.push({number:source.number,kind:'score',question:i,value:String(source.scores[i]),old});
  }
  const desired=status(source.participation);
  if(current.status!==desired){const node=target.participation;
   if(!node||node.disabled||node.isConnected===false)throw Error(source.number+' numaralı öğrencinin katılım alanı düzenlenemiyor.');
   const matches=Array.from(node.options||[]).filter(o=>status(o.textContent||o.label)===desired&&!o.disabled);
   if(matches.length!==1)throw Error(source.number+' için katılım seçeneği tek olarak eşleşmedi.');
   operations.push({number:source.number,kind:'status',value:String(matches[0].value),old:String(node.value)});
  }
  rows.push({number:source.number,name:source.name,oldScores:current.scores,newScores:source.scores,oldTotal:current.reportedTotal,newTotal:source.total,participation:source.participation});
 }
 return {data,operations,rows,snapshotKey:JSON.stringify({maxima:snapshot.questionMaxima,students:snapshot.students})};
}
export async function applyEokulFill(plan,doc,loc,collector=collectEokulSnapshot){
 if(loc.protocol!=='https:'||loc.hostname!=='e-okul.meb.gov.tr'||!/^\/OrtaOgretim\/OKL\/OOK10020\.aspx$/i.test(loc.pathname))throw Error('Doğrulanmış e-Okul not giriş ekranı açık değil.');
 const before=collector(doc,loc,new Date(),true),fresh=planEokulFill(before,before.targets,plan.data);
 if(fresh.snapshotKey!==plan.snapshotKey)throw Error('Önizlemeden sonra ekrandaki değerler değişti. Dosyayı yeniden seçip kontrol edin; alanlar doldurulmadı.');
 const touched=[],view=doc.defaultView;
 const setValue=(node,value)=>{const proto=node.tagName==='SELECT'?view?.HTMLSelectElement?.prototype:view?.HTMLInputElement?.prototype,setter=proto&&Object.getOwnPropertyDescriptor(proto,'value')?.set;if(setter)setter.call(node,value);else node.value=value;node.dispatchEvent(new view.Event('input',{bubbles:true}));node.dispatchEvent(new view.Event('change',{bubbles:true}));};
 try{
  for(const op of fresh.operations){
   const current=collector(doc,loc,new Date(),true),target=current.targets.find(t=>t.number===op.number),node=op.kind==='status'?target?.participation:target?.scoreInputs[op.question];
   if(!node||node.disabled||node.readOnly||node.isConnected===false)throw Error('Doldurma sırasında alan yapısı değişti.');
   const old=String(node.value);touched.push({number:op.number,kind:op.kind,question:op.question,old});setValue(node,op.value);
  }
  await new Promise(resolve=>view.requestAnimationFrame?view.requestAnimationFrame(()=>view.requestAnimationFrame(resolve)):resolve());
  const after=collector(doc,loc),expected=plan.data.students;
  for(const s of expected){const r=after.students.find(r=>r.number===s.number),status={'Sınava Girdi':'Girdi','Sınava Girmedi':'Girmedi','Muaf':'Muaf','Kopya':'Kopya'}[s.participation];if(!r||r.status!==status||(status!=='Muaf'&&r.scores.some((n,i)=>n!==s.scores[i])))throw Error('Doldurulan değerler ekrandan doğrulanamadı.');}
  for(const old of before.students.filter(r=>!expected.some(s=>s.number===r.number))){const current=after.students.find(r=>r.number===old.number);if(!current||current.status!==old.status||JSON.stringify(current.scores)!==JSON.stringify(old.scores))throw Error('Sayfa seçilmeyen bir öğrencinin alanlarını değiştirdi; kontrol gerekli.');}
  return {students:expected.length,changedFields:touched.length,totalWarnings:expected.filter(s=>s.total!==null&&after.students.find(r=>r.number===s.number)?.reportedTotal!==s.total).map(s=>s.number)};
 }catch(error){
  let restored=true;for(const item of touched.reverse()){try{const current=collector(doc,loc,new Date(),true),target=current.targets.find(t=>t.number===item.number),node=item.kind==='status'?target?.participation:target?.scoreInputs[item.question];if(!node||node.isConnected===false){restored=false;continue;}setValue(node,item.old);}catch{restored=false;}}
  try{const back=collector(doc,loc);restored=restored&&before.students.every(old=>{const row=back.students.find(r=>r.number===old.number);return row&&row.status===old.status&&JSON.stringify(row.scores)===JSON.stringify(old.scores);});}catch{restored=false;}
  throw Error(error.message+(restored?' Yapılan alan değişiklikleri geri alındı; ekranı kontrol edin.':' Bazı alanlar geri alınamadı; Kaydet’e basmadan ekranı kontrol edin.'));
 }
}
export function launchEokulFill(collect,planFill,applyFill,doc,loc){
 if(loc.protocol!=='https:'||loc.hostname!=='e-okul.meb.gov.tr'||!/^\/OrtaOgretim\/OKL\/OOK10020\.aspx$/i.test(loc.pathname)){alert('Önce e-Okul not giriş ekranını açın.');return;}
 const existing=doc.getElementById('__sa_eokul_fill');if(existing){alert('Aktarım aracı zaten açık.');return;}
 const host=doc.createElement('div');host.id='__sa_eokul_fill';const root=host.attachShadow({mode:'open'});doc.body.appendChild(host);
 const style=doc.createElement('style');style.textContent=':host{all:initial;position:fixed;inset:4vh 4vw;z-index:2147483647;font:15px system-ui;color:#173e30}section{box-sizing:border-box;background:white;border:2px solid #1c7356;border-radius:14px;padding:22px;max-height:92vh;overflow:auto;box-shadow:0 10px 70px #0006}button{padding:10px 15px;margin:8px;border-radius:8px;border:1px solid #1c7356;cursor:pointer}button:disabled{opacity:.45;cursor:default}table{border-collapse:collapse;width:100%;font-size:13px}td,th{border:1px solid #ddd;padding:7px;text-align:left}p{line-height:1.5}.error{color:#a11}input{margin:10px}';root.appendChild(style);
 const panel=doc.createElement('section');root.appendChild(panel);const add=(tag,text,parent=panel)=>{const n=doc.createElement(tag);if(text)n.textContent=text;parent.appendChild(n);return n;};
 add('h2','Sınav Asistanı · e-Okul kutularını doldur');add('p','Uygulamadan indirdiğiniz onaylı aktarım dosyasını seçin. Önce sınıfı, sınavı ve puanları kontrol edin. Bu araç e-Okul’daki Kaydet düğmesine basmaz.');
 const close=add('button','Kapat');close.type='button';close.onclick=()=>host.remove();const label=add('label','Onaylı aktarım dosyası: '),file=add('input','',label);file.type='file';file.accept='.json,application/json';
 const message=add('p',''),preview=add('div',''),confirmLabel=add('label',''),confirm=add('input','',confirmLabel);confirm.type='checkbox';confirmLabel.appendChild(doc.createTextNode('Bu ekrandaki sınıfı, sınavı ve aşağıdaki puanları kontrol ettim.'));
 const fill=add('button','Onayladığım puanları kutulara doldur');fill.type='button';fill.disabled=true;let plan=null;
 confirm.onchange=()=>{fill.disabled=!plan||!confirm.checked||!plan.operations.length;};
 file.onchange=async()=>{plan=null;fill.disabled=true;confirm.checked=false;preview.replaceChildren();message.className='';try{const f=file.files?.[0];if(!f)return;if(f.size>1024*1024)throw Error('Dosya en fazla 1 MB olabilir.');const data=JSON.parse((await f.text()).replace(/^\uFEFF/,'')),snapshot=collect(doc,loc,new Date(),true);plan=planFill(snapshot,snapshot.targets,data);add('h3',data.exam.className+' · '+data.exam.subject+' · '+data.exam.name,preview);add('p',plan.rows.length+' öğrenci eşleşti · '+plan.operations.length+' alan değişecek. Soru üst puanları: '+data.exam.maxima.join(' / '),preview);const table=add('table','',preview),head=add('tr','',table);for(const h of ['Okul no','Ad soyad','Yeni soru puanları','Eski / yeni toplam','Katılım'])add('th',h,head);for(const r of plan.rows){const tr=add('tr','',table);for(const text of [r.number,r.name,r.newScores.map(v=>v===null?'—':v).join(' / '),(r.oldTotal??'—')+' / '+(r.newTotal??'—'),r.participation])add('td',String(text),tr);}if(!plan.operations.length)message.textContent='Değerler zaten aynı; doldurulacak değişiklik yok.';}catch(e){message.className='error';message.textContent=e.message;}};
 fill.onclick=async()=>{if(!plan||!confirm.checked)return;fill.disabled=true;file.disabled=true;confirm.disabled=true;close.disabled=true;try{const result=await applyFill(plan,doc,loc,collect);message.textContent=result.students+' öğrencinin kutuları kontrol edildi; '+result.changedFields+' alan dolduruldu. e-Okul’da Kaydet’e basılmadı. Son kontrolü yapıp Kaydet’e kendiniz basabilirsiniz.'+(result.totalWarnings.length?' Toplam alanı henüz eşleşmeyen numaralar: '+result.totalWarnings.join(', ')+'. Toplamları ayrıca kontrol edin.':'');plan=null;}catch(e){message.className='error';message.textContent=e.message;plan=null;}finally{file.disabled=false;confirm.disabled=false;confirm.checked=false;close.disabled=false;}};
}
export function eokulFillBookmark(){const code=`(()=>{const collectEokulSnapshot=${collectEokulSnapshot.toString()};const validateEokulTransfer=${validateEokulTransfer.toString()};const planEokulFill=${planEokulFill.toString()};const applyEokulFill=${applyEokulFill.toString()};(${launchEokulFill.toString()})(collectEokulSnapshot,planEokulFill,applyEokulFill,document,location)})()`;return 'javascript:'+encodeURIComponent(code);}
