export function normalizeReading(data,count){
  if(!data||typeof data.fullText!=='string'||data.fullText.length>80000||!Array.isArray(data.answers)||data.answers.length>count)throw new Error('Okuma sonucu beklenen biçimde değil.');
  const seen=new Set();
  for(const row of data.answers){if(!Number.isInteger(row.question)||row.question<1||row.question>count||seen.has(row.question)||typeof row.text!=='string'||row.text.length>10000||typeof row.unclear!=='boolean'||!['','A','B','C','D','E','-','?'].includes(row.choice))throw new Error('Okuma sonucu beklenen biçimde değil.');seen.add(row.question)}
  return {fullText:data.fullText,answers:Array.from({length:count},(_,i)=>data.answers.find(row=>row.question===i+1)||{question:i+1,text:'',choice:'',unclear:true})};
}
export function choicesForReview(reading){return reading.answers.map(row=>row.unclear||!['A','B','C','D','E','-'].includes(row.choice)?'':row.choice)}
export async function fingerprintPaper(file){const digest=await crypto.subtle.digest('SHA-256',await file.arrayBuffer());return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
export function restoreReading(saved,fingerprint,count){if(!saved||saved.paperFingerprint!==fingerprint)return null;try{return normalizeReading(saved.reading,count)}catch{return null}}
