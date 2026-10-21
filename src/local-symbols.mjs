import {cropQuestion} from './local-reading.mjs';
import {applyPaperTone} from './paper-tone.mjs';
export function singleLetter(text){const t=String(text||'').trim().toUpperCase().replace(/[.\s]/g,'');return ['D','Y','X'].includes(t)?t:''}
const templates={
 '✓':[[[0,.52],[.3,1],[1,0]]],
 'tickcurve':[[[0,.4],[.15,.8],[.3,1],[.5,.9],[.7,.65],[.85,.35],[1,0]]],
 'X':[[[0,0],[1,1]],[[0,1],[1,0]]]
};
function sample(lines){return lines.flatMap(line=>line.slice(1).flatMap((b,i)=>{const a=line[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*50);return Array.from({length:n+1},(_,j)=>[a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n])}))}
const shapes=Object.entries(templates).map(([symbol,lines])=>({symbol:symbol==='tickcurve'?'✓':symbol,points:sample(lines)}));
export function classifySymbol(points){
 if(points.length<8)return {symbol:'',confidence:0};
 let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;for(const p of points){l=Math.min(l,p[0]);r=Math.max(r,p[0]);t=Math.min(t,p[1]);b=Math.max(b,p[1])}const w=r-l,h=b-t;
 if(w<3||h<3||w/h<.35||w/h>1.8)return {symbol:'',confidence:0};
 const cloud=points.filter((_,i)=>i%Math.max(1,Math.floor(points.length/350))===0).map(p=>[(p[0]-l)/w,(p[1]-t)/h]);
 const distance=(a,b)=>a.reduce((sum,p)=>sum+Math.min(...b.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1]))),0)/a.length;
 const candidates=shapes.map(s=>({...s,error:(distance(cloud,s.points)+distance(s.points,cloud))/2}));const ranked=['✓','X'].map(symbol=>candidates.filter(s=>s.symbol===symbol).sort((a,b)=>a.error-b.error)[0]).sort((a,b)=>a.error-b.error);
 return ranked[0].error<.075&&ranked[1].error-ranked[0].error>.025?{symbol:ranked[0].symbol,confidence:Math.round(100*(1-ranked[0].error*4))}:{symbol:'',confidence:0};
}
function lineCenters(counts,threshold){const groups=[];for(let i=0;i<counts.length;i++)if(counts[i]>=threshold){if(groups.length&&i-groups.at(-1).at(-1)<=3)groups.at(-1).push(i);else groups.push([i])}return groups.map(g=>Math.round(g.reduce((a,b)=>a+b,0)/g.length))}
export function tableCells(mask,w,h){
 const rows=new Array(h).fill(0),cols=new Array(w).fill(0);for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x]){rows[y]++;cols[x]++}
 const horizontal=lineCenters(rows,w*.48);let vertical=lineCenters(cols,h*.42);
 const spans=[];for(const y of horizontal){const runs=[];let run=[];for(let x=0;x<w;x++){let ink=false;for(let dy=-3;dy<=3;dy++)if(y+dy>=0&&y+dy<h&&mask[(y+dy)*w+x])ink=true;if(ink){if(run.length&&x-run.at(-1)>8){runs.push(run);run=[]}run.push(x)}}if(run.length)runs.push(run);const longest=runs.sort((a,b)=>(b.at(-1)-b[0])-(a.at(-1)-a[0]))[0];if(longest&&longest.at(-1)-longest[0]>w*.35)spans.push([longest[0],longest.at(-1)])}
 if(spans.length>=3){const left=spans.map(s=>s[0]).sort((a,b)=>a-b)[Math.floor(spans.length/2)],right=spans.map(s=>s[1]).sort((a,b)=>a-b)[Math.floor(spans.length/2)];vertical=vertical.filter(x=>x>=left-8&&x<=right+8)}
 if(horizontal.length<3||vertical.length<3)return [];
 const cells=[];for(let y=0;y<horizontal.length-1;y++)for(let x=0;x<vertical.length-1;x++){const l=vertical[x]+4,t=horizontal[y]+4,r=vertical[x+1]-4,b=horizontal[y+1]-4;if(r-l>10&&b-t>10)cells.push({row:y+1,column:x+1,x:l,y:t,width:r-l,height:b-t})}return cells.slice(0,64);
}
export function gridSkews(mask,w,h){
 const pts=[];for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(mask[y*w+x])pts.push([x,y]);
 const bestSlope=vertical=>{let best={score:0,slope:0};for(let step=-20;step<=20;step++){const slope=step*.0025,offset=Math.ceil((vertical?h:w)*.06),bins=new Uint32Array((vertical?w:h)+offset*2+2);for(const p of pts){const bin=Math.round((vertical?p[0]-slope*p[1]:p[1]-slope*p[0]))+offset;if(bin>=0&&bin<bins.length)bins[bin]++}const peaks=Array.from(bins).sort((a,b)=>b-a).slice(0,18),score=peaks.reduce((n,v)=>n+v*v,0);if(score>best.score)best={score,slope}}return best.slope};
 return {horizontal:bestSlope(false),vertical:bestSlope(true)};
}
function pixels(canvas){const w=canvas.width,h=canvas.height,rgba=canvas.getContext('2d').getImageData(0,0,w,h).data,gray=Array.from({length:w*h},(_,i)=>.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2]),mean=gray.reduce((a,b)=>a+b,0)/gray.length,threshold=Math.min(225,mean-12);return gray.map(v=>v<threshold?1:0)}
async function imageCanvas(url){const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=()=>no(new Error('İşaret görüntüsü açılamadı.'));img.src=url});let c=document.createElement('canvas');const scale=Math.min(1,1200/img.naturalWidth,1400/img.naturalHeight);c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);const mask=pixels(c),skew=gridSkews(mask,c.width,c.height);if(Math.abs(skew.horizontal)>.002||Math.abs(skew.vertical)>.002){const d=document.createElement('canvas'),dx=Math.max(0,skew.vertical*c.height),dy=Math.max(0,skew.horizontal*c.width);d.width=c.width+Math.ceil(Math.abs(skew.vertical*c.height));d.height=c.height+Math.ceil(Math.abs(skew.horizontal*c.width));const ctx=d.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,d.width,d.height);ctx.setTransform(1,-skew.horizontal,-skew.vertical,1,dx,dy);ctx.drawImage(c,0,0);c.width=c.height=0;c=d}return c}
export async function readPaperSymbols(paper,areas,reader,signal,tone,onProgress){
 const result=[];
 for(let part=0;part<areas.length;part++){
  signal.throwIfAborted();const canvas=await imageCanvas(await cropQuestion(paper,[areas[part]]));
  const w=canvas.width,h=canvas.height,mask=pixels(canvas);
  const cells=tableCells(mask,w,h);if(!cells.length)cells.push({row:1,column:1,x:0,y:0,width:w,height:h});
  for(let i=0;i<cells.length;i++){
   signal.throwIfAborted();onProgress?.(`İşaretler · ${part+1}. alan · ${i+1}/${cells.length} hücre`);
   const cell=cells[i],crop=document.createElement('canvas');crop.width=cell.width;crop.height=cell.height;crop.getContext('2d').drawImage(canvas,cell.x,cell.y,cell.width,cell.height,0,0,cell.width,cell.height);
   const points=[];for(let y=0;y<cell.height;y++)for(let x=0;x<cell.width;x++)if(mask[(cell.y+y)*w+cell.x+x])points.push([x,y]);
   const density=points.length/(cell.width*cell.height),shape=classifySymbol(points);
   let symbol=shape.symbol,confidence=shape.confidence;
   if(!symbol&&density>.005&&density<.35){const ocr=await reader.read(await applyPaperTone(crop.toDataURL('image/png'),tone),false,'10');signal.throwIfAborted();const letter=singleLetter(ocr.text);if(letter&&Number(ocr.confidence)>=65){symbol=letter;confidence=Math.round(ocr.confidence)}}
   result.push({part:part+1,row:cell.row,column:cell.column,symbol,confidence,blank:density<.003,image:crop.toDataURL('image/png')});crop.width=crop.height=0;
  }
  canvas.width=canvas.height=0;
 }
 return result;
}
