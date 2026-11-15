export function validateExplanation(v){
 if(v===undefined)return;
 if(!v||!['key','teacher','missing','unreadable'].includes(v.source)||typeof v.text!=='string'||v.text.length>3000||(['key','teacher'].includes(v.source)&&!v.text.trim())||(['missing','unreadable'].includes(v.source)&&v.text!==''))throw Error('Cevap açıklamasını kontrol edin.');
 if(v.source==='key'&&(!Number.isInteger(v.page)||v.page<1||v.page>12))throw Error('Cevap açıklamasının sayfası geçersiz.');
}
export function missingExplanations(instructions,targets){return targets.filter(q=>!instructions?.questions?.[q-1]?.explanation?.text?.trim());}
// Existing saved flags must not make optional explanations mandatory.
export function requireExplanations(instructions,targets){for(const q of targets)validateExplanation(instructions?.questions?.[q-1]?.explanation);}
export function normalizeExplanations(data,questions,targets){
 if(!Array.isArray(data?.explanations)||data.explanations.length!==targets.length)throw Error('Anahtarın cevap açıklamaları eksik döndü.');
 return targets.map(question=>{const rows=data.explanations.filter(r=>r.question===question);if(rows.length!==1||question<1||question>questions)throw Error('Cevap açıklamasının sorusu doğrulanamadı.');const r=rows[0].explanation||rows[0];if(!['key','missing','unreadable'].includes(r.source))throw Error('Anahtar açıklaması doğrulanamadı.');const explanation={source:r.source,text:r.text,...(r.source==='key'?{page:r.page}:{})};validateExplanation(explanation);return {question,explanation};});
}
