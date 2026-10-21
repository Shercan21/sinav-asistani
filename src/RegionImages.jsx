import React,{useEffect,useState} from 'react';
import {cropQuestion} from './local-reading.mjs';
export default function RegionImages({paper,areas,question,children}){
 const [images,setImages]=useState([]),[error,setError]=useState('');
 useEffect(()=>{let active=true;setImages([]);setError('');if(paper&&areas.length)Promise.all(areas.map(async a=>({area:a,url:await cropQuestion(paper,[a])}))).then(values=>{if(active)setImages(values)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[paper,areas]);
 return <>{images.map(({area,url},i)=><div className="question-piece" key={area.id||i}>{area.max!==undefined&&area.max!==''&&<span className="rubric-points">{i+1}. alan · {area.max} puan</span>}{children?children(area,url,i):<img src={url} alt={`${question}. sorunun cevap anahtarı, ${i+1}. alan`}/>}</div>)}{areas.length>0&&!images.length&&!error&&<p role="status">Soru görüntüsü hazırlanıyor…</p>}{error&&<p role="alert">{error}</p>}</>;
}
