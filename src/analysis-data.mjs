// Analiz ve değerlendirme: yazılı sınavlar, seri puan taraması ve optik okumaları
// tek bir "kaynak" biçimine çevirir; özet, soru, konu ve öğrenci gelişimi hesaplar.
import {gradeExam} from './exam-data.mjs';

const num = v => v === '' || v === null || v === undefined ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
const r2 = v => v === null ? null : Math.round(v * 100) / 100;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const PASS = 50;

// Kaynağa iliştirilen isteğe bağlı analiz bilgisi: {date, topics[], max[]}
export function validAnalysisMeta(meta, questions) {
  if (meta === undefined) return true;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return false;
  if (meta.date !== undefined && !(meta.date === '' || (typeof meta.date === 'string' && DATE.test(meta.date)))) return false;
  if (meta.topics !== undefined && (!Array.isArray(meta.topics) || meta.topics.length !== questions || meta.topics.some(t => typeof t !== 'string' || t.length > 300))) return false;
  if (meta.max !== undefined && (!Array.isArray(meta.max) || meta.max.length !== questions || meta.max.some(m => m !== '' && !(typeof m === 'number' && Number.isFinite(m) && m > 0 && m <= 100)))) return false;
  return Object.keys(meta).every(k => ['date', 'topics', 'max'].includes(k));
}
export function cleanMeta(meta, questions) {
  const out = {};
  if (meta?.date && DATE.test(meta.date)) out.date = meta.date;
  const topics = Array.from({length: questions}, (_, i) => String(meta?.topics?.[i] ?? '').trim().slice(0, 300));
  if (topics.some(Boolean)) out.topics = topics;
  const max = Array.from({length: questions}, (_, i) => { const v = num(meta?.max?.[i]); return v !== null && v > 0 && v <= 100 ? v : ''; });
  if (max.some(v => v !== '')) out.max = max;
  return out;
}

const day = iso => typeof iso === 'string' && iso.length >= 10 ? iso.slice(0, 10) : '';
const scanSum = scores => scores.length && scores.every(v => num(v) !== null) ? r2(scores.reduce((a, v) => a + Number(v), 0)) : null;

function fromExam(exam, classes) {
  const classroom = classes.find(c => c.name === exam.className);
  const students = classroom?.students || [];
  const key = Array.isArray(exam.key) && exam.key.length === exam.questions ? exam.key : null;
  const meta = exam.analysis || {};
  const questions = Array.from({length: exam.questions}, (_, i) => ({
    no: i + 1, max: key ? Number(key[i].max) : null,
    answer: key && /^[A-E]$/.test(key[i].answer || '') ? key[i].answer : null,
    topic: meta.topics?.[i] || ''}));
  const rows = [];
  for (const s of students) {
    const values = exam.results?.[s.id];
    if (!values || !key) continue;
    const total = gradeExam(exam, values);
    if (total === null) continue;
    const choiceMode = exam.type === 'Test' && values.every(v => /^[A-E-]$/.test(v));
    const perQ = questions.map((q, i) => {
      if (choiceMode) {
        const v = values[i], choice = v === '-' ? null : v, correct = choice !== null && choice === q.answer;
        return {got: correct ? q.max : 0, max: q.max, choice, correct};
      }
      return {got: num(values[i]), max: q.max, choice: null, correct: null};
    });
    rows.push({studentId: s.id, number: s.number, name: s.name, total, perQ});
  }
  return {id: 'exam:' + exam.id, ref: exam.id, kind: 'exam', label: 'Sınav', name: exam.name, subject: exam.subject || '',
    classId: classroom?.id || '', className: exam.className, date: meta.date || exam.date || '', choices: exam.type === 'Test' ? 5 : 0,
    type: exam.type, questions, rows, meta, keyReady: !!key};
}

function fromSerial(session, templates, classes) {
  const template = templates.find(t => t.id === session.templateId);
  const classroom = classes.find(c => c.id === session.classId);
  if (!template || !classroom) return null;
  const n = template.questions, meta = session.analysis || {};
  const questions = Array.from({length: n}, (_, i) => ({no: i + 1, max: num(meta.max?.[i]), answer: null, topic: meta.topics?.[i] || ''}));
  const rows = [];
  const seen = new Set();
  for (const r of session.rows || []) {
    if (!r.include || !r.studentId || seen.has(r.studentId)) continue;
    const s = (classroom.students || []).find(x => x.id === r.studentId);
    if (!s) continue;
    const total = scanSum(r.scores) ?? num(r.paperTotal);
    if (total === null) continue;
    seen.add(r.studentId);
    rows.push({studentId: s.id, number: s.number, name: s.name, total: Math.min(100, total),
      perQ: questions.map((q, i) => ({got: num(r.scores[i]), max: q.max, choice: null, correct: null}))});
  }
  return {id: 'serial:' + session.id, ref: session.id, kind: 'serial', label: 'Seri tarama', name: session.name, subject: '',
    classId: classroom.id, className: classroom.name, date: meta.date || day(session.createdAt), choices: 0, type: 'Klasik',
    questions, rows, meta, keyReady: true};
}

function fromOptical(session, classes) {
  const meta = session.analysis || {};
  const n = session.questions, each = 100 / n;
  const questions = Array.from({length: n}, (_, i) => ({no: i + 1, max: each, answer: session.key?.[i] || null, topic: meta.topics?.[i] || ''}));
  const bySource = new Map();
  for (const r of session.results || []) {
    const classroom = classes.find(c => c.id === r.classId);
    const s = classroom && (classroom.students || []).find(x => x.id === r.studentId);
    if (!s) continue;
    if (!bySource.has(classroom.id)) bySource.set(classroom.id, {classroom, rows: []});
    const perQ = r.answers.map((a, i) => {
      const k = r.key?.[i] || '';
      if (!k) return {got: null, max: each, choice: a.state === 'marked' ? a.answer : null, correct: null};
      const choice = a.state === 'marked' ? a.answer : null, correct = choice === k;
      return {got: correct ? each : 0, max: each, choice, correct};
    });
    bySource.get(classroom.id).rows.push({studentId: s.id, number: s.number, name: s.name, total: r2(Number(r.score)), perQ});
  }
  // Bir optik oturumu birden çok şubeyi içerebilir: her şube ayrı kaynak olur.
  return [...bySource.values()].map(({classroom, rows}) => ({
    id: 'optical:' + session.id + ':' + classroom.id, ref: session.id, kind: 'optical', label: 'Optik', name: session.name, subject: '',
    classId: classroom.id, className: classroom.name, date: meta.date || day(session.createdAt), choices: session.choices, type: 'Test',
    questions, rows, meta, keyReady: true}));
}

export function collectSources({classes = [], exams = [], serial, optical}) {
  const out = [];
  for (const e of exams) out.push(fromExam(e, classes));
  for (const s of serial?.sessions || []) { const x = fromSerial(s, serial.templates || [], classes); if (x) out.push(x); }
  for (const s of optical?.sessions || []) out.push(...fromOptical(s, classes));
  return out.sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.name.localeCompare(b.name, 'tr'));
}

export function summary(source) {
  const t = source.rows.map(r => r.total).filter(v => v !== null).sort((a, b) => a - b);
  if (!t.length) return {n: 0, avg: null, max: null, min: null, median: null, sd: null, pass: null, hist: Array(10).fill(0)};
  const avg = t.reduce((a, v) => a + v, 0) / t.length;
  const sd = Math.sqrt(t.reduce((a, v) => a + (v - avg) ** 2, 0) / t.length);
  const hist = Array(10).fill(0);
  for (const v of t) hist[Math.min(9, Math.floor(v / 10))]++;
  const mid = t.length >> 1;
  return {n: t.length, avg: r2(avg), max: t.at(-1), min: t[0], median: r2(t.length % 2 ? t[mid] : (t[mid - 1] + t[mid]) / 2),
    sd: r2(sd), pass: Math.round(t.filter(v => v >= PASS).length / t.length * 100), hist};
}

export function questionStats(source) {
  return source.questions.map((q, i) => {
    const cells = source.rows.map(r => r.perQ[i]).filter(Boolean);
    const graded = cells.filter(c => c.got !== null);
    const avgGot = graded.length ? graded.reduce((a, c) => a + c.got, 0) / graded.length : null;
    const pct = avgGot !== null && q.max ? Math.round(avgGot / q.max * 100) : null;
    const choices = {};
    let blank = 0;
    if (source.choices) {
      for (const c of cells) { if (c.choice) choices[c.choice] = (choices[c.choice] || 0) + 1; else blank++; }
    }
    const wrong = Object.entries(choices).filter(([k]) => k !== q.answer).sort((a, b) => b[1] - a[1])[0];
    return {...q, n: graded.length, avgGot: r2(avgGot), pct, choices, blank, distractor: wrong && wrong[1] > 0 ? wrong[0] : null};
  });
}

export const status = pct => pct === null ? '' : pct >= 70 ? 'Kazanılmış' : pct >= 40 ? 'Kısmen' : 'Tekrar edilmeli';

// Konu/kazanım başarısı: o konudaki soruların toplam alınan / toplam en yüksek puanı
export function topicStats(sources) {
  const map = new Map();
  for (const s of sources) s.questions.forEach((q, i) => {
    if (!q.topic || !q.max) return;
    if (!map.has(q.topic)) map.set(q.topic, {topic: q.topic, got: 0, max: 0, questions: []});
    const t = map.get(q.topic);
    t.questions.push(sources.length > 1 ? `${s.name} ${q.no}` : String(q.no));
    for (const r of s.rows) { const c = r.perQ[i]; if (c && c.got !== null) { t.got += c.got; t.max += q.max; } }
  });
  return [...map.values()].map(t => ({...t, pct: t.max ? Math.round(t.got / t.max * 100) : null})).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));
}

export function studentTopics(source) {
  const topics = [...new Set(source.questions.map(q => q.max ? q.topic : '').filter(Boolean))];
  return {topics, rows: source.rows.map(r => ({...r, cells: topics.map(t => {
    let got = 0, max = 0;
    source.questions.forEach((q, i) => { if (q.topic === t && q.max && r.perQ[i]?.got !== null) { got += r.perQ[i].got; max += q.max; } });
    return max ? Math.round(got / max * 100) : null;
  })}))};
}

// Aynı adlı sınavın diğer şubelerdeki sonuçları
const same = s => s.trim().toLocaleLowerCase('tr').replace(/\s+/g, ' ');
export function sectionCompare(source, sources) {
  return sources.filter(s => s.kind === source.kind && same(s.name) === same(source.name) && (s.subject || '') === (source.subject || ''))
    .map(s => ({id: s.id, className: s.className, ...summary(s)})).filter(x => x.n).sort((a, b) => b.avg - a.avg);
}

const month = d => d ? d.slice(0, 7) : '';
const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const monthLabel = m => m ? `${AYLAR[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}` : 'Tarihsiz';
function monthly(entries) {
  const m = new Map();
  for (const e of entries) { if (!e.month) continue; if (!m.has(e.month)) m.set(e.month, []); m.get(e.month).push(e.total); }
  return [...m.keys()].sort().map(k => ({month: k, label: monthLabel(k), n: m.get(k).length, avg: r2(m.get(k).reduce((a, v) => a + v, 0) / m.get(k).length)}));
}

export function studentProgress(studentId, sources) {
  const mine = sources.filter(s => s.rows.some(r => r.studentId === studentId));
  const entries = mine.map(s => { const r = s.rows.find(x => x.studentId === studentId); return {source: s, total: r.total, date: s.date, month: month(s.date)}; })
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999'));
  const classEntries = mine.flatMap(s => s.rows.map(r => ({total: r.total, month: month(s.date)})));
  const months = monthly(entries), classMonths = monthly(classEntries);
  const own = sources.map(s => ({...s, rows: s.rows.filter(r => r.studentId === studentId)})).filter(s => s.rows.length);
  const totals = entries.map(e => e.total);
  return {entries, months, classMonths: months.map(m => classMonths.find(c => c.month === m.month)?.avg ?? null), topics: topicStats(own),
    avg: totals.length ? r2(totals.reduce((a, v) => a + v, 0) / totals.length) : null,
    change: months.length > 1 ? r2(months.at(-1).avg - months[0].avg) : null};
}

export function classProgress(classId, sources) {
  const mine = sources.filter(s => s.classId === classId);
  return monthly(mine.flatMap(s => s.rows.map(r => ({total: r.total, month: month(s.date)}))));
}

export function studentTable(classroom, sources) {
  const mine = sources.filter(s => s.classId === classroom.id);
  return (classroom.students || []).map(st => {
    const e = mine.map(s => ({s, r: s.rows.find(r => r.studentId === st.id)})).filter(x => x.r)
      .sort((a, b) => (a.s.date || '9999').localeCompare(b.s.date || '9999'));
    const totals = e.map(x => x.r.total);
    return {...st, count: e.length, avg: totals.length ? r2(totals.reduce((a, v) => a + v, 0) / totals.length) : null,
      last: totals.at(-1) ?? null, change: totals.length > 1 ? r2(totals.at(-1) - totals.at(-2)) : null};
  });
}
