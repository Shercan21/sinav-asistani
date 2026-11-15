import React from 'react';
import {compareReadingScores} from './reading-score-comparison.mjs';
export default function ReadingScoreComparison({draft,answerKey,savedScores}){
 if(!Array.isArray(savedScores))return null;
 const result=compareReadingScores(draft,answerKey,savedScores),fmt=n=>n===null?'Bekleniyor':n.toLocaleString('tr-TR');
 return <details className="student-evidence-details"><summary>Kayıtlı sonuç ile yeni okuma karşılaştırması</summary><p>Bu tablo puan değiştirmez. Kayıtlı sonuç ancak öğretmen tarafından doğrulanmışsa doğruluk kontrolü için referans alınmalıdır. Eksik veya eski öneriler sıfır sayılmaz.</p><div className="table-scroll"><table><thead><tr><th>Soru</th><th>Kayıtlı puan</th><th>Yeni okuma önerisi</th><th>Fark</th></tr></thead><tbody>{result.rows.map(r=><tr key={r.question}><td>{r.question}</td><td>{fmt(r.saved)}</td><td>{fmt(r.proposed)}</td><td>{r.difference===null?'Karşılaştırılamadı':(r.difference>0?'+':'')+fmt(r.difference)}</td></tr>)}</tbody></table></div><p>{result.compared} / {answerKey.length} soru karşılaştırılabildi. {result.averageDifference!==null&&<>Karşılaştırılabilen sorularda ortalama mutlak puan farkı: {fmt(result.averageDifference)}.</>}</p></details>;
}
