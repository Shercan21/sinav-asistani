export function validateImageComparison(input){
  if(!input||input.comparison!=='images'||!Number.isInteger(input.questions)||input.questions<1||input.questions>200||!['Klasik','Karma'].includes(input.examType)||!Array.isArray(input.maxima)||input.maxima.length!==input.questions||input.maxima.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<=0||n>100)||Math.abs(input.maxima.reduce((a,b)=>a+b,0)-100)>.001)throw new Error('Görüntü karşılaştırma puanları geçersiz.');
  if(input.targetQuestion!==undefined&&(!Number.isInteger(input.targetQuestion)||input.targetQuestion<1||input.targetQuestion>input.questions))throw new Error('Soru numarası geçersiz.');
  let size=0;
  for(const image of [input.studentImage,input.keyImage]){if(!image||!['image/jpeg','image/png','image/webp','application/pdf'].includes(image.mimeType)||typeof image.base64!=='string'||!image.base64.length||image.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64))throw new Error('İki geçerli kâğıt görüntüsü gerekli.');size+=image.base64.length}
  if(size>14*1024*1024)throw new Error('İki görüntünün toplamı çok büyük; dosyaları küçültün.');
  return input;
}
export function normalizeImageComparison(data,input){
  validateImageComparison(input);
  const expected=input.targetQuestion?[input.targetQuestion]:input.maxima.map((_,i)=>i+1);
  if(!Array.isArray(data?.answers)||data.answers.length!==expected.length)throw new Error('Görüntü karşılaştırma sonucu eksik.');
  const seen=new Set();
  for(const row of data.answers){if(!expected.includes(row.question)||seen.has(row.question)||typeof row.reason!=='string'||row.reason.length>3000||typeof row.unclear!=='boolean'||(row.score!==null&&(typeof row.score!=='number'||!Number.isFinite(row.score)||row.score<0||row.score>input.maxima[row.question-1])))throw new Error('Görüntü karşılaştırma sonucu geçersiz.');seen.add(row.question)}
  return {answers:expected.map(question=>{const row=data.answers.find(r=>r.question===question);return {...row,score:row.unclear?null:row.score,unclear:row.unclear||row.score===null}})};
}
