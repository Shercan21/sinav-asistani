import React,{useEffect,useState} from 'react';
import {readPaper} from './paper-store.mjs';
import {locateKeyQuestions} from './key-question-images.mjs';
import RegionImages from './RegionImages.jsx';
export default function VisualKeyReference({examId,visualRubric,questions,question}){
 const [file,setFile]=useState(null),[regions,setRegions]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(true);
 useEffect(()=>{let active=true;setBusy(true);setFile(null);setRegions([]);setError('');readPaper(visualRubric?.paperId||`${examId}:__answer_key__`).then(async f=>{if(!active)return;if(!f){setError('Cevap anahtarı bölümünden kayıtlı bir anahtar seçin.');return}setFile(f);if(visualRubric)setRegions(visualRubric.regions);else{const found=await locateKeyQuestions(f,questions);if(active)setRegions(found)}}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[examId,visualRubric,questions]);
 return <><h4>Cevap anahtarı · {question}. soru</h4>{file&&regions[question-1]?.length>0&&<RegionImages paper={file} question={question} areas={regions[question-1]}/>} {busy&&<p role="status">Anahtarın soru alanları hazırlanıyor…</p>}{!busy&&!error&&!regions[question-1]?.length&&<p>Bu sorunun alanlarını cevap anahtarı bölümünde seçin.</p>}{error&&<p role="status">{error}</p>}</>;
}
