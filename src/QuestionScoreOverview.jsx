import React,{useEffect,useRef,useState} from 'react';
import {readingLabel} from './ocr-review-data.mjs';
import QuestionAnnotator from './QuestionAnnotator.jsx';
import VisualKeyReference from './VisualKeyReference.jsx';
function QuestionRow({index,score,draft,paper,examId,visualRubric,questions,selected,busy,onSelect,onReadQuestion}){
 const node=useRef(null),[visible,setVisible]=useState(false);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'250px'});if(node.current)observer.observe(node.current);return()=>observer.disconnect()},[]);
 const number=index+1;
 return <article ref={node} className={`question-score-row${selected?' selected':''}`} aria-label={`${number}. soru karşılaştırması`}><div className="question-score-heading"><h4>{number}. soru</h4><span>Verilen puan: <strong>{score===''?'Girilmedi':Number(score).toLocaleString('tr-TR')}</strong></span><button type="button" className="secondary" disabled={busy} onClick={()=>onSelect(index)} aria-label={`${number}. soruyu düzenle`}>Düzenle</button><button type="button" className="secondary" disabled={busy} onClick={()=>onReadQuestion(index)} aria-label={`${number}. soruyu yeniden oku`}>Yeniden oku</button></div><p className="reading-badge">{readingLabel(draft.reading[index])} · {draft.checked[index]?'Kontrol edildi':'Kontrol bekliyor'}</p>{visible?<div className="score-image-pair"><section><h4>Öğrenci cevabı</h4><div className="score-preview">{draft.areas[index]?.length?<QuestionAnnotator paper={paper} areas={draft.areas[index]} question={number} marks={draft.marks} disabled preview/>:<p>Alan seçilmedi. Düzenle ile alan seçebilirsiniz.</p>}</div></section><aside><div className="score-preview"><VisualKeyReference examId={examId} visualRubric={visualRubric} questions={questions} question={number}/></div></aside></div>:<p>Karşılaştırma görüntüleri hazırlanıyor…</p>}</article>;
}
export default function QuestionScoreOverview({scores,draft,paper,examId,visualRubric,questions,selected,busy,onSelect,onReadQuestion}){
 return <section className="question-score-overview" aria-label="Bütün soruların puanları ve resimleri"><h3>Soru puanları ve karşılaştırma</h3><p>Her sorunun puanı, öğrenci cevabı ve cevap anahtarı aşağıda birlikte gösterilir. Puan vermek veya değiştirmek için Düzenle’ye basın.</p>{scores.map((score,index)=><QuestionRow key={index} {...{index,score,draft,paper,examId,visualRubric,questions,busy,onSelect,onReadQuestion}} selected={selected===index}/>)}</section>;
}
