export const scanFold=value=>String(value||'').normalize('NFKD').replace(/\p{M}/gu,'').toLocaleUpperCase('tr-TR').replace(/İ/g,'I').replace(/[^A-Z0-9]/g,'');
export function scanNumber(text){const s=String(text??'').trim().replace(/\s/g,'');if(!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(s))return '';const n=Number(s.replace(',','.'));return Number.isFinite(n)&&n>=0&&n<=100?n:''}
export const scanTotal=scores=>scores.length&&scores.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100)?Math.round(scores.reduce((a,b)=>a+b,0)*100)/100:null;
export function scanMatch(identity,students,className){
 const number=String(identity.number||'').trim(),name=scanFold(identity.fullName),classRead=scanFold(identity.className);
 const num=s=>String(s).replace(/^0+(?=\d)/,'');
 const byNumber=/^\d+$/.test(number)?students.filter(s=>num(s.number)===num(number)):[];
 const byName=name?students.filter(s=>scanFold(s.name)===name):[];
 if(classRead&&classRead!==scanFold(className))return {id:'',reason:'Okunan sınıf seçili sınıfla uyuşmuyor.'};
 if(byNumber.length>1||byName.length>1)return {id:'',reason:'Birden fazla öğrenci eşleşiyor; öğrenciyi seçin.'};
 if(byNumber.length===1&&byName.length===1&&byNumber[0].id!==byName[0].id)return {id:'',reason:'Numara ve ad farklı öğrencileri gösteriyor.'};
 if(byNumber.length===1)return {id:byNumber[0].id,reason:name&&!byName.length?'Numara eşleşti; okunan adı kontrol edin.':'Numara eşleşti.'};
 if(number&&byNumber.length===0)return {id:'',reason:'Okunan numara sınıf listesinde yok; öğrenciyi seçin.'};
 if(byName.length===1)return {id:byName[0].id,reason:'Ad soyad eşleşti.'};
 const surname=name&&students.filter(s=>scanFold(s.name.trim().split(/\s+/).at(-1))===name);
 if(surname?.length===1)return {id:surname[0].id,reason:'Yalnız soyadı eşleşti; öğrenciyi doğrulayın.'};
 return {id:'',reason:surname?.length>1?'Aynı soyadında birden fazla öğrenci var.':'Öğrenci eşleşmedi; listeden seçin.'};
}
export function scanRowIssues(row,rows,students,questions){
 const issues=[];if(!students.some(s=>s.id===row.studentId))issues.push('Öğrenciyi seçin.');
 if(row.scores.length!==questions||scanTotal(row.scores)===null)issues.push('Bütün soru puanlarını tamamlayın.');
 const total=scanTotal(row.scores);if(total!==null&&total>100)issues.push('Toplam 100 puanı aşıyor.');
 if(row.paperTotal!==''&&(!Number.isFinite(row.paperTotal)||row.paperTotal<0||row.paperTotal>100))issues.push('Kâğıt toplamı geçersiz.');
 if(total!==null&&row.paperTotal!==''&&Math.abs(total-row.paperTotal)>.01&&!row.totalAccepted)issues.push('Soru toplamı kâğıttaki toplamdan farklı.');
 if(row.studentId&&rows.some(r=>r.id!==row.id&&r.include&&r.studentId===row.studentId))issues.push('Bu öğrenci iki kez okutuldu; bir satırı dışarıda bırakın.');
 if(row.status==='reading'||row.status==='failed')issues.push('Okumayı tamamlayın veya bilgileri elle kontrol edin.');
 return issues;
}
export function validScanTemplate(t){
 if(!t||!Number.isInteger(t.questions)||t.questions<1||t.questions>40||!Number.isFinite(t.aspect)||t.aspect<.3||t.aspect>5)return false;
 const required=['anchor',...Array.from({length:t.questions},(_,i)=>`q${i+1}`)];
 if(!t.fields?.fullName&&!t.fields?.number)return false;
 return [...required,...Object.keys(t.fields||{})].every(k=>{const a=t.fields[k];return a&&[a.x,a.y,a.width,a.height].every(Number.isFinite)&&a.x>=0&&a.y>=0&&a.width>=.01&&a.height>=.01&&a.x+a.width<=1.001&&a.y+a.height<=1.001});
}
// Capture once, then require a visible removal before the next sheet can arm.
export class ScanCaptureGate{
 constructor(){this.armed=true;this.stableSince=null;this.absentSince=null}
 step({present,quality,stable,busy,now}){
  if(!present){this.stableSince=null;this.absentSince??=now;if(now-this.absentSince>=650)this.armed=true;return false}
  this.absentSince=null;if(busy||!this.armed||!quality||!stable){this.stableSince=null;return false}
  this.stableSince??=now;if(now-this.stableSince<700)return false;
  this.armed=false;this.stableSince=null;return true;
 }
}
