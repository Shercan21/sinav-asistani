export function parseRoster(text, existing = []) {
  const rows = text.trim().split(/\r?\n/).filter(line => line.trim());
  if (!rows.length) throw new Error('Öğrenci listesini girin.');
  const seen = new Set(existing.map(s => s.number));
  return rows.map((line, index) => {
    const match = line.trim().match(/^(\S+?)[;\t]+\s*(.+)$/);
    if (!match || !match[1].trim() || !match[2].trim()) throw new Error(`${index + 1}. satır: numara ve adı noktalı virgülle ayırın.`);
    const number = match[1].trim(), name = match[2].trim();
    if (seen.has(number)) throw new Error(`${number} numarası zaten listede veya tekrar edilmiş.`);
    seen.add(number);
    return { number, name };
  });
}
export function validateKey(key, count, type) {
  if (key.length !== count) return false;
  return key.every(q => Number.isFinite(Number(q.max)) && Number(q.max) > 0 && Number(q.max) <= 100 && (type !== 'Test' || q.visual===true || /^[A-E]$/.test(q.answer))) && Math.abs(key.reduce((sum,q)=>sum+Number(q.max),0)-100)<0.001;
}
export function gradeExam(exam, values) {
  if (!validateKey(exam.key || [], exam.questions, exam.type) || values.length !== exam.questions) return null;
  const useTestChoices=exam.type==='Test'&&(!exam.visualRubric||values.every(v=>/^[A-E-]$/.test(v)));
  let total = 0;
  for (let i = 0; i < exam.questions; i++) {
    const q = exam.key[i], value = values[i];
    if (value === undefined || value === null || value === '') return null;
    if (useTestChoices) {
      if (!/^[A-E-]$/.test(value)) return null;
      if (value === q.answer) total += Number(q.max);
    } else {
      const points = Number(value);
      if (!Number.isFinite(points) || points < 0 || points > Number(q.max)) return null;
      total += points;
    }
  }
  return Math.round(total * 100) / 100;
}
export function examResults(exam, students) {
  return students.map(student => {
    const values = exam.results?.[student.id];
    return { ...student, score: values ? gradeExam(exam, values) : null };
  });
}
