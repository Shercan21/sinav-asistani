export function normalizeKeyReading(value, questions) {
  if (!value || !Array.isArray(value.answers) || value.answers.length > questions) throw new Error('Cevap anahtarı sonucu geçersiz.');
  const rows = new Map();
  for (const row of value.answers) {
    if (!Number.isInteger(row.question) || row.question < 1 || row.question > questions || rows.has(row.question) || typeof row.text !== 'string' || row.text.length > 10000 || !['A','B','C','D','E','?'].includes(row.choice) || typeof row.unclear !== 'boolean' || !(row.max === null || typeof row.max === 'number' && Number.isFinite(row.max) && row.max > 0 && row.max <= 100)) throw new Error('Cevap anahtarı sonucu geçersiz.');
    rows.set(row.question, {question:row.question,text:row.text,choice:row.choice,max:row.max,unclear:row.unclear});
  }
  return {answers:Array.from({length:questions},(_,i)=>rows.get(i+1)||{question:i+1,text:'',choice:'?',max:null,unclear:true})};
}

export function keyDraft(reading, examType) {
  return reading.answers.map(row=>({max:row.max??'',answer:row.unclear?'':examType==='Test'?(row.choice==='?'?'':row.choice):row.text}));
}
