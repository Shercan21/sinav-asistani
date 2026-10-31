import test from 'node:test';
import assert from 'node:assert/strict';
import {collectSources, summary, questionStats, topicStats, studentTopics, sectionCompare, studentProgress, classProgress, studentTable, validAnalysisMeta, cleanMeta, status} from '../src/analysis-data.mjs';
import {validateBackup} from '../src/backup-data.mjs';

const students = [{id: 's1', number: '12', name: 'Ayşe'}, {id: 's2', number: '15', name: 'Mehmet'}, {id: 's3', number: '20', name: 'Ali'}];
const classes = [{id: 'c1', name: '9-A', count: 3, students}, {id: 'c2', name: '9-B', count: 1, students: [{id: 's4', number: '7', name: 'Zeynep'}]}];
const key = [{answer: 'A', max: 25}, {answer: 'B', max: 25}, {answer: 'C', max: 25}, {answer: 'D', max: 25}];
const testExam = {id: 'e1', name: '1. Yazılı', className: '9-A', subject: 'Kimya', questions: 4, type: 'Test', key,
  results: {s1: ['A', 'B', 'C', 'D'], s2: ['A', 'C', 'C', '-'], s3: ['B', 'C', 'C', 'A']},
  analysis: {date: '2026-10-05', topics: ['Atom', 'Atom', 'Mol', 'Mol']}};
const klasik = {id: 'e2', name: '2. Yazılı', className: '9-A', subject: 'Kimya', questions: 2, type: 'Klasik',
  key: [{answer: '', max: 40}, {answer: '', max: 60}], results: {s1: ['40', '50'], s2: ['20', '30']}, analysis: {date: '2026-11-10', topics: ['Atom', 'Bağlar']}};
const otherSection = {...testExam, id: 'e3', className: '9-B', results: {s4: ['A', 'B', 'A', 'A']}};

test('test exam summary and question analysis', () => {
  const [src] = collectSources({classes, exams: [testExam]});
  assert.equal(src.rows.length, 3);
  assert.deepEqual(src.rows.map(r => r.total), [100, 50, 25]);
  const s = summary(src);
  assert.equal(s.avg, 58.33); assert.equal(s.max, 100); assert.equal(s.min, 25); assert.equal(s.pass, 67);
  const q = questionStats(src);
  assert.equal(q[1].pct, 33); assert.equal(q[1].distractor, 'C'); assert.equal(q[3].blank, 1);
  assert.equal(q[0].choices.A, 2);
});

test('topic stats, student-topic matrix and section comparison', () => {
  const sources = collectSources({classes, exams: [testExam, otherSection]});
  const src = sources.find(s => s.ref === 'e1');
  const t = topicStats([src]);
  assert.deepEqual(t.map(x => [x.topic, x.pct]), [['Atom', 50], ['Mol', 67]]);
  assert.equal(status(67), 'Kısmen'); assert.equal(status(80), 'Kazanılmış'); assert.equal(status(20), 'Tekrar edilmeli');
  const m = studentTopics(src);
  assert.deepEqual(m.topics, ['Atom', 'Mol']);
  assert.deepEqual(m.rows.find(r => r.studentId === 's2').cells, [50, 50]);
  const cmp = sectionCompare(src, sources);
  assert.deepEqual(cmp.map(c => c.className), ['9-A', '9-B']);
});

test('serial and optical sessions become sources; monthly progress', () => {
  const serial = {version: 1, templates: [{id: 't1', questions: 2}], sessions: [{id: 'z1', name: 'Seri', classId: 'c1', templateId: 't1', createdAt: '2026-12-02T10:00:00Z',
    analysis: {max: [50, 50], topics: ['Mol', 'Mol']},
    rows: [{id: 'r1', studentId: 's1', scores: [40, 50], paperTotal: '', include: true}, {id: 'r2', studentId: '', scores: [1, 1], include: true}, {id: 'r3', studentId: 's2', scores: [10, 20], include: false}]}]};
  const optical = {version: 2, sessions: [{id: 'o1', name: 'Optik', questions: 2, choices: 4, key: ['A', 'B'], createdAt: '2026-12-20T08:00:00Z',
    results: [{classId: 'c1', studentId: 's1', answers: [{state: 'marked', answer: 'A'}, {state: 'blank', answer: ''}], key: ['A', 'B'], score: 50}]}]};
  const sources = collectSources({classes, exams: [testExam, klasik], serial, optical});
  const ser = sources.find(s => s.kind === 'serial');
  assert.equal(ser.rows.length, 1); assert.equal(ser.rows[0].total, 90); assert.equal(ser.date, '2026-12-02');
  assert.equal(questionStats(ser)[0].pct, 80);
  const opt = sources.find(s => s.kind === 'optical');
  assert.equal(opt.rows[0].total, 50); assert.equal(questionStats(opt)[1].blank, 1);
  const p = studentProgress('s1', sources);
  assert.deepEqual(p.months.map(m => [m.month, m.avg]), [['2026-10', 100], ['2026-11', 90], ['2026-12', 70]]);
  assert.equal(p.change, -30);
  assert.deepEqual(p.classMonths, [58.33, 70, 70]);
  assert.equal(classProgress('c1', sources).length, 3);
  const table = studentTable(classes[0], sources);
  assert.equal(table[0].count, 4); assert.equal(table[0].last, 50);
});

test('analysis metadata validation and backups', () => {
  assert.ok(validAnalysisMeta(undefined, 3));
  assert.ok(validAnalysisMeta({date: '2026-10-01', topics: ['a', '', 'b']}, 3));
  assert.ok(!validAnalysisMeta({topics: ['a']}, 3));
  assert.ok(!validAnalysisMeta({date: '01.10.2026'}, 3));
  assert.ok(!validAnalysisMeta({x: 1}, 3));
  assert.deepEqual(cleanMeta({date: '2026-10-01', topics: [' Atom ', ''], max: ['', '20']}, 2), {date: '2026-10-01', topics: ['Atom', ''], max: ['', 20]});
  assert.deepEqual(cleanMeta({topics: ['', '']}, 2), {});
  const backup = {format: 'sinav-asistani', version: 1, classes, exams: [testExam], papers: []};
  assert.ok(validateBackup(backup));
  assert.throws(() => validateBackup({...backup, exams: [{...testExam, analysis: {topics: ['x']}}]}));
});
