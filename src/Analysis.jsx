import React, {useMemo, useState} from 'react';
import {collectSources, summary, questionStats, topicStats, studentTopics, sectionCompare, studentProgress, classProgress, studentTable, cleanMeta, status, PASS} from './analysis-data.mjs';
import {loadScanState, saveScanState, scanStorageKey} from './scan-store.mjs';
import {loadOpticalCollection, saveOpticalCollection} from './scan-archive-store.mjs';
import KAZANIMLAR from './kazanimlar.json';
import './analysis.css';

const fmt = v => v === null || v === undefined ? '—' : String(Math.round(v * 100) / 100).replace('.', ',');
const pctColor = p => p === null ? '#cbd5d0' : p >= 70 ? '#1f9d55' : p >= 40 ? '#e0a100' : '#d64545';
const dateTR = d => d ? `${d.slice(8, 10)}.${d.slice(5, 7)}.${d.slice(0, 4)}` : 'Tarihsiz';
const gradeOf = name => { const m = String(name).match(/(\d{1,2})/); return m ? Number(m[1]) : null; };

function Bar({pct}) {
  return <div className="an-bar"><div style={{width: `${Math.max(2, pct ?? 0)}%`, background: pctColor(pct)}}/><span>{pct === null ? '—' : `%${pct}`}</span></div>;
}
function Tiles({items}) {
  return <div className="an-tiles">{items.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}</div>;
}
function Status({pct}) {
  const s = status(pct);
  return s ? <span className={'an-status ' + (pct >= 70 ? 'ok' : pct >= 40 ? 'mid' : 'low')}>{s}</span> : null;
}

// Aylık çizgi grafik: öğrenci (düz) ve şube ortalaması (kesik)
function LineChart({labels, series}) {
  const W = 640, H = 200, P = 36, n = labels.length;
  const x = i => P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1));
  const y = v => H - 26 - v / 100 * (H - 48);
  return <svg className="an-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Aylık gelişim grafiği">
    {[0, 25, 50, 75, 100].map(v => <g key={v}><line x1={P} x2={W - P} y1={y(v)} y2={y(v)} stroke="currentColor" strokeOpacity=".12"/><text x="4" y={y(v) + 4} fontSize="10" fill="currentColor" fillOpacity=".55">{v}</text></g>)}
    {labels.map((l, i) => <text key={i} x={x(i)} y={H - 6} fontSize="11" textAnchor="middle" fill="currentColor" fillOpacity=".7">{l}</text>)}
    {series.map(s => {
      const pts = s.values.map((v, i) => v === null ? null : [x(i), y(v)]).filter(Boolean);
      return <g key={s.name}>
        {pts.length > 1 && <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={s.color} strokeWidth="3" strokeLinejoin="round" strokeDasharray={s.dashed ? '6 5' : undefined}/>}
        {s.values.map((v, i) => v === null ? null : <g key={i}><circle cx={x(i)} cy={y(v)} r="4.5" fill={s.color}/>{!s.dashed && <text x={x(i)} y={y(v) - 9} fontSize="11" fontWeight="700" textAnchor="middle" fill={s.color}>{Math.round(v)}</text>}</g>)}
      </g>;
    })}
  </svg>;
}

function Histogram({hist}) {
  const max = Math.max(1, ...hist);
  return <div className="an-hist">{hist.map((c, i) => <div key={i} title={`${i * 10}–${i === 9 ? 100 : i * 10 + 9}: ${c} öğrenci`}>
    <span className="an-hist-n">{c || ''}</span><div style={{height: `${c / max * 100}%`, background: i * 10 >= PASS ? '#2f8f68' : '#e08a3c'}}/><small>{i * 10}</small></div>)}</div>;
}

// Soru konuları, tarih ve (seri taramada) soru puanları
function MetaEditor({source, onSave}) {
  const [date, setDate] = useState(source.date || '');
  const [topics, setTopics] = useState(source.questions.map(q => q.topic));
  const [max, setMax] = useState(source.questions.map(q => q.max ?? ''));
  const grade = gradeOf(source.className);
  const dersler = Object.keys(KAZANIMLAR[grade] || {});
  const guess = dersler.find(d => source.subject && d.toLocaleLowerCase('tr').startsWith(source.subject.trim().toLocaleLowerCase('tr').slice(0, 4))) || '';
  const [ders, setDers] = useState(guess);
  const list = (KAZANIMLAR[grade] || {})[ders] || [];
  const listId = 'kz-' + source.id.replace(/\W/g, '');
  const editMax = source.kind === 'serial';
  const fillAll = () => setTopics(t => t.map((v, i) => v || (i > 0 ? t[i - 1] : v)));
  const save = () => onSave(cleanMeta({date, topics, max: editMax ? max.map(v => v === '' ? '' : Number(v)) : undefined}, source.questions.length));
  return <details className="an-editor no-print" open={!source.questions.some(q => q.topic)}>
    <summary>Soru konuları ve sınav tarihi</summary>
    <p className="an-muted">Her sorunun konusunu ya da kazanımını yazın; konu ve kazanım raporu buna göre çıkar. Aylık gelişim için sınav tarihini girin.</p>
    <div className="an-row">
      <label>Sınav tarihi<input type="date" value={date} onChange={e => setDate(e.target.value)}/></label>
      {grade && dersler.length > 0 && <label>Kazanım listesi ({grade}. sınıf)<select value={ders} onChange={e => setDers(e.target.value)}><option value="">Liste yok, serbest yazacağım</option>{dersler.map(d => <option key={d}>{d}</option>)}</select></label>}
    </div>
    <datalist id={listId}>{list.map(k => <option key={k} value={k}/>)}</datalist>
    <div className="an-topic-grid">{source.questions.map((q, i) => <div key={i} className="an-topic-row">
      <span>{q.no}.</span>
      <input list={listId} placeholder={i ? 'Konu / kazanım' : 'ör. Atom modelleri ya da KİM.9.1.3'} value={topics[i]} onChange={e => setTopics(t => t.map((v, j) => j === i ? e.target.value : v))} aria-label={`${q.no}. soru konusu`}/>
      {editMax && <input type="number" min="0" max="100" step="0.5" className="an-max" placeholder="Puan" value={max[i]} onChange={e => setMax(m => m.map((v, j) => j === i ? e.target.value : v))} aria-label={`${q.no}. soru en yüksek puan`}/>}
    </div>)}</div>
    {editMax && <p className="an-muted">Seri taramada soru başarı yüzdesi için her sorunun en yüksek puanını girin.</p>}
    <div className="an-row"><button type="button" className="secondary" onClick={fillAll}>Boşları üstteki konuyla doldur</button><button type="button" className="primary" onClick={save}>Kaydet</button></div>
  </details>;
}

function ExamAnalysis({source, sources, onSaveMeta}) {
  const s = summary(source), qs = questionStats(source), topics = topicStats([source]), matrix = studentTopics(source), compare = sectionCompare(source, sources);
  const weak = topics.filter(t => t.pct !== null && t.pct < 40);
  const letters = source.choices ? 'ABCDE'.slice(0, source.choices).split('') : [];
  const order = [...source.rows].sort((a, b) => String(a.number).localeCompare(String(b.number), 'tr', {numeric: true}));
  return <div className="an-report">
    <div className="an-print-head"><h2>{source.name}</h2><p>{source.className}{source.subject ? ' · ' + source.subject : ''} · {dateTR(source.date)} · {source.label}</p></div>
    <MetaEditor key={source.id + JSON.stringify(source.meta)} source={source} onSave={meta => onSaveMeta(source, meta)}/>
    {!source.keyReady && <div className="notice">Bu sınavın cevap anahtarı hazır değil; sonuçlar hesaplanamıyor.</div>}
    {!s.n ? <p className="an-muted">Bu sınav için henüz kaydedilmiş öğrenci sonucu yok.</p> : <>
      <Tiles items={[['Öğrenci', s.n], ['Ortalama', fmt(s.avg)], ['En yüksek', fmt(s.max)], ['En düşük', fmt(s.min)], ['Ortanca', fmt(s.median)], [`Başarılı (≥${PASS})`, `%${s.pass}`]]}/>
      <section className="an-card"><h3>Puan dağılımı</h3><Histogram hist={s.hist}/><p className="an-muted">Standart sapma {fmt(s.sd)}. Turuncu çubuklar {PASS} puanın altını gösterir.</p></section>
      {compare.length > 1 && <section className="an-card"><h3>Şube karşılaştırması</h3><div className="table-scroll"><table><thead><tr><th>Şube</th><th>Öğrenci</th><th>Ortalama</th><th>Başarılı</th><th></th></tr></thead><tbody>
        {compare.map(c => <tr key={c.id} className={c.id === source.id ? 'an-current' : ''}><td>{c.className}</td><td>{c.n}</td><td><strong>{fmt(c.avg)}</strong></td><td>%{c.pass}</td><td><Bar pct={Math.round(c.avg)}/></td></tr>)}
      </tbody></table></div></section>}
      <section className="an-card"><h3>Konu / kazanım başarısı</h3>
        {!topics.length ? <p className="an-muted">Konu raporu için yukarıdan soruların konularını girin.</p> : <>
          {weak.length ? <div className="an-warn">Tekrar edilmesi önerilen: {weak.map(t => t.topic).join(', ')}</div> : <div className="an-good">Sınıfın %40’ın altında kaldığı konu yok.</div>}
          <div className="table-scroll"><table><thead><tr><th>Konu / kazanım</th><th>Sorular</th><th>Sınıf başarısı</th><th>Durum</th></tr></thead><tbody>
            {topics.map(t => <tr key={t.topic}><td>{t.topic}</td><td>{t.questions.join(', ')}</td><td><Bar pct={t.pct}/></td><td><Status pct={t.pct}/></td></tr>)}
          </tbody></table></div>
          {matrix.topics.length > 1 && <><h4>Öğrenci – konu tablosu</h4><div className="table-scroll"><table className="an-heat"><thead><tr><th>Öğrenci</th>{matrix.topics.map((t, i) => <th key={t} title={t}>{i + 1}</th>)}<th>Puan</th></tr></thead><tbody>
            {matrix.rows.map(r => <tr key={r.studentId}><td>{r.number} {r.name}</td>{r.cells.map((c, i) => <td key={i} style={{background: c === null ? '' : pctColor(c) + '2e', color: pctColor(c)}}>{c ?? '—'}</td>)}<td><strong>{fmt(r.total)}</strong></td></tr>)}
          </tbody></table></div><p className="an-muted">Sütunlar: {matrix.topics.map((t, i) => `${i + 1}) ${t}`).join('  ')}</p></>}
        </>}
      </section>
      <section className="an-card"><h3>Soru analizi</h3><div className="table-scroll"><table><thead><tr><th>Soru</th><th>Konu</th>
        {letters.length > 0 && <><th>Cevap</th>{letters.map(l => <th key={l}>{l}</th>)}<th>Boş</th></>}
        {!letters.length && <th>Ortalama puan</th>}<th>Başarı</th></tr></thead><tbody>
        {qs.map(q => <tr key={q.no}><td>{q.no}</td><td>{q.topic || '—'}</td>
          {letters.length > 0 && <><td><strong>{q.answer || '—'}</strong></td>{letters.map(l => <td key={l} className={l === q.answer ? 'an-right' : l === q.distractor ? 'an-wrong' : ''}>{q.choices[l] || 0}</td>)}<td>{q.blank}</td></>}
          {!letters.length && <td>{fmt(q.avgGot)}{q.max ? ` / ${fmt(q.max)}` : ''}</td>}
          <td><Bar pct={q.pct}/></td></tr>)}
      </tbody></table></div>
        <p className="an-muted">{letters.length ? 'Yeşil: doğru şık. Kırmızı: en çok işaretlenen yanlış şık (çeldirici). ' : ''}Başarısı %40’ın altındaki sorular yeniden anlatılmaya adaydır.{source.kind === 'serial' && qs.some(q => !q.max) ? ' Seri taramada başarı yüzdesi için soru puanlarını girin.' : ''}</p>
      </section>
      <section className="an-card"><h3>Not çizelgesi</h3><div className="table-scroll"><table><thead><tr><th>No</th><th>Ad soyad</th><th>Puan</th></tr></thead><tbody>
        {order.map(r => <tr key={r.studentId}><td>{r.number}</td><td>{r.name}</td><td><strong>{fmt(r.total)}</strong></td></tr>)}
      </tbody></table></div></section>
      <button type="button" className="secondary no-print" onClick={() => window.print()}>Raporu yazdır / PDF</button>
    </>}
  </div>;
}

function StudentReport({student, classroom, sources}) {
  const p = studentProgress(student.id, sources);
  return <div className="an-report">
    <div className="an-print-head"><h2>{student.name}</h2><p>{classroom.name} · No {student.number}</p></div>
    {!p.entries.length ? <p className="an-muted">Bu öğrencinin kayıtlı sonucu yok.</p> : <>
      <Tiles items={[['Sınav', p.entries.length], ['Ortalama', fmt(p.avg)], ['İlk aydan son aya', p.change === null ? '—' : (p.change >= 0 ? '+' : '') + fmt(p.change)]]}/>
      <section className="an-card"><h3>Aylık gelişim</h3>
        {p.months.length ? <><LineChart labels={p.months.map(m => m.label)} series={[{name: 'şube', values: p.classMonths, color: '#9aa9a1', dashed: true}, {name: 'öğrenci', values: p.months.map(m => m.avg), color: '#217153'}]}/>
          <p className="an-legend"><span style={{color: '#217153'}}>● {student.name}</span><span style={{color: '#9aa9a1'}}>- - Şube ortalaması</span></p>
          <div className="table-scroll"><table><thead><tr><th>Ay</th><th>Sınav</th><th>Ortalama</th><th>Şube ortalaması</th></tr></thead><tbody>
            {p.months.map((m, i) => <tr key={m.month}><td>{m.label}</td><td>{m.n}</td><td><strong>{fmt(m.avg)}</strong></td><td>{fmt(p.classMonths[i])}</td></tr>)}
          </tbody></table></div></> : <p className="an-muted">Grafik için sınavlara tarih girin (Sınav analizi → Soru konuları ve sınav tarihi).</p>}
      </section>
      {p.topics.length > 0 && <section className="an-card"><h3>Konulara göre (bütün sınavlar)</h3><div className="table-scroll"><table><thead><tr><th>Konu / kazanım</th><th>Başarı</th><th>Durum</th></tr></thead><tbody>
        {p.topics.map(t => <tr key={t.topic}><td>{t.topic}</td><td><Bar pct={t.pct}/></td><td><Status pct={t.pct}/></td></tr>)}
      </tbody></table></div></section>}
      <section className="an-card"><h3>Girdiği sınavlar</h3><div className="table-scroll"><table><thead><tr><th>Tarih</th><th>Sınav</th><th>Tür</th><th>Puan</th><th>Sınıf ort.</th></tr></thead><tbody>
        {[...p.entries].reverse().map(e => <tr key={e.source.id}><td>{dateTR(e.date)}</td><td>{e.source.name}</td><td>{e.source.label}</td><td><strong>{fmt(e.total)}</strong></td><td>{fmt(summary(e.source).avg)}</td></tr>)}
      </tbody></table></div></section>
      <button type="button" className="secondary no-print" onClick={() => window.print()}>Karneyi yazdır / PDF</button>
    </>}
  </div>;
}

function ClassReport({classroom, sources, openStudent}) {
  const months = classProgress(classroom.id, sources), rows = studentTable(classroom, sources), mine = sources.filter(s => s.classId === classroom.id && s.rows.length);
  const all = mine.flatMap(s => s.rows.map(r => r.total));
  return <div className="an-report">
    <div className="an-print-head"><h2>{classroom.name} şube raporu</h2></div>
    <Tiles items={[['Öğrenci', (classroom.students || []).length], ['Sınav', mine.length], ['Genel ortalama', all.length ? fmt(all.reduce((a, v) => a + v, 0) / all.length) : '—'], ['Son ay', months.length ? fmt(months.at(-1).avg) : '—']]}/>
    <section className="an-card"><h3>Aylık şube ortalaması</h3>{months.length ? <LineChart labels={months.map(m => m.label)} series={[{name: 'şube', values: months.map(m => m.avg), color: '#217153'}]}/> : <p className="an-muted">Tarihli sınav sonucu yok.</p>}</section>
    <section className="an-card"><h3>Öğrenciler</h3>{!rows.length ? <p className="an-muted">Bu sınıfın isim listesi henüz eklenmedi.</p> : <div className="table-scroll"><table><thead><tr><th>No</th><th>Ad soyad</th><th>Sınav</th><th>Ortalama</th><th>Son puan</th><th>Değişim</th></tr></thead><tbody>
      {[...rows].sort((a, b) => String(a.number).localeCompare(String(b.number), 'tr', {numeric: true})).map(r => <tr key={r.id}><td>{r.number}</td><td><button type="button" className="an-link" onClick={() => openStudent(r.id)}>{r.name}</button></td><td>{r.count}</td><td>{fmt(r.avg)}</td><td>{fmt(r.last)}</td>
        <td>{r.change === null ? '' : <strong style={{color: r.change >= 0 ? '#1f9d55' : '#d64545'}}>{r.change >= 0 ? '▲' : '▼'} {fmt(Math.abs(r.change))}</strong>}</td></tr>)}
    </tbody></table></div>}</section>
    <button type="button" className="secondary no-print" onClick={() => window.print()}>Şube raporunu yazdır / PDF</button>
  </div>;
}

export default function Analysis({exams, classes, setExams, inform}) {
  const [tick, setTick] = useState(0);
  const serial = useMemo(() => loadScanState(), [tick]);
  const optical = useMemo(() => loadOpticalCollection(), [tick]);
  const sources = useMemo(() => collectSources({classes, exams, serial, optical}), [classes, exams, serial, optical]);
  const [tab, setTab] = useState('sinav');
  const [sourceId, setSourceId] = useState('');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [studentId, setStudentId] = useState('');
  const source = sources.find(s => s.id === sourceId) || sources.find(s => s.rows.length) || sources[0];
  const classroom = classes.find(c => c.id === classId) || classes[0];
  const student = classroom?.students?.find(s => s.id === studentId);

  const saveMeta = (src, meta) => {
    const value = Object.keys(meta).length ? meta : undefined;
    try {
      if (src.kind === 'exam') setExams(list => list.map(e => { if (e.id !== src.ref) return e; const {analysis, ...rest} = e; return value ? {...rest, analysis: value} : rest; }));
      else if (src.kind === 'serial') {
        // Ham kayıt değiştirilir; yarım kalmış okuma satırlarına dokunulmaz.
        const raw = JSON.parse(localStorage.getItem(scanStorageKey()) || 'null');
        if (!raw?.sessions) throw new Error();
        saveScanState({...raw, sessions: raw.sessions.map(s => { if (s.id !== src.ref) return s; const {analysis, ...rest} = s; return value ? {...rest, analysis: value} : rest; })});
      } else {
        const c = loadOpticalCollection();
        saveOpticalCollection({...c, sessions: c.sessions.map(s => { if (s.id !== src.ref) return s; const {analysis, ...rest} = s; return value ? {...rest, analysis: value} : rest; })});
      }
      setTick(t => t + 1);
      inform('Konular ve tarih kaydedildi.');
    } catch { inform('Kaydedilemedi. Sayfayı yenileyip yeniden deneyin.'); }
  };
  const groups = [['exam', 'Sınavlar'], ['serial', 'Seri puan taramaları'], ['optical', 'Test / optik okumalar']];
  return <section className="panel an-root">
    <div className="an-tabs no-print" role="tablist">{[['sinav', 'Sınav analizi'], ['ogrenci', 'Öğrenci gelişimi'], ['sube', 'Şube özeti']].map(([k, l]) =>
      <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'sinav' && (!sources.length ? <p className="an-muted">Henüz sınav, seri tarama ya da optik okuma yok.</p> : <>
      <label className="no-print">Analiz edilecek sınav<select value={source?.id || ''} onChange={e => setSourceId(e.target.value)}>
        {groups.map(([k, l]) => sources.some(s => s.kind === k) && <optgroup key={k} label={l}>{sources.filter(s => s.kind === k).map(s =>
          <option key={s.id} value={s.id}>{s.name} · {s.className} · {dateTR(s.date)} · {s.rows.length} sonuç</option>)}</optgroup>)}
      </select></label>
      {source && <ExamAnalysis key={source.id} source={source} sources={sources} onSaveMeta={saveMeta}/>}
    </>)}
    {tab !== 'sinav' && (!classes.length ? <p className="an-muted">Önce sınıf ekleyin.</p> : <div className="an-row no-print">
      <label>Sınıf<select value={classroom?.id || ''} onChange={e => { setClassId(e.target.value); setStudentId(''); }}>{classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      {tab === 'ogrenci' && <label>Öğrenci<select value={student?.id || ''} onChange={e => setStudentId(e.target.value)}><option value="">Öğrenci seçin</option>
        {[...(classroom?.students || [])].sort((a, b) => String(a.number).localeCompare(String(b.number), 'tr', {numeric: true})).map(s => <option key={s.id} value={s.id}>{s.number} · {s.name}</option>)}</select></label>}
    </div>)}
    {tab === 'ogrenci' && classroom && (student ? <StudentReport key={student.id} student={student} classroom={classroom} sources={sources}/> : <p className="an-muted">{(classroom.students || []).length ? 'Gelişimini görmek için öğrenci seçin.' : 'Bu sınıfın isim listesi henüz eklenmedi.'}</p>)}
    {tab === 'sube' && classroom && <ClassReport classroom={classroom} sources={sources} openStudent={id => { setStudentId(id); setTab('ogrenci'); }}/>}
  </section>;
}

