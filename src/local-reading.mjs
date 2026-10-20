import {openPaper} from './paper-render.mjs';
export async function createLocalReader(onProgress){
  const {createWorker}=await import('tesseract.js');
  const worker=await createWorker(['tur','eng'],1,{logger:m=>onProgress?.(`${m.status}${Number.isFinite(m.progress)?` · %${Math.round(m.progress*100)}`:''}`)});
  let closed=false;
  return {close:async()=>{if(!closed){closed=true;await worker.terminate()}},read:async(image,blocks=false)=>{if(closed)throw new Error('Yerel okuma kapatıldı.');await worker.setParameters({tessedit_pageseg_mode:blocks?'3':'6'});return (await worker.recognize(image,{},blocks?{blocks:true}:{text:true})).data}};
}
export function blockLines(data,width,height,offset=0,scale=1){
  const lines=[];
  for(const block of data.blocks||[])for(const paragraph of block.paragraphs||[])for(const line of paragraph.lines||[]){
    if(!line.bbox)continue;
    lines.push({text:line.text||line.words?.map(w=>w.text).join(' ')||'',x:offset+line.bbox.x0/width*scale,y:line.bbox.y0/height});
  }
  return lines;
}
export async function findPaperQuestions(paper,reader,signal,onProgress){
  const source=await openPaper(paper),pages=[];
  try{
    if(source.count>12)throw new Error('Bu deneme sürümünde soru bulma en fazla 12 sayfayı destekler.');
    for(let page=1;page<=source.count;page++){
      signal?.throwIfAborted();onProgress?.(`${page}/${source.count} sayfada sorular bulunuyor…`);
      const canvas=await source.render(page),lines=[];
      try{for(const side of [0,1]){
        signal?.throwIfAborted();const piece=document.createElement('canvas'),x=side?Math.floor(canvas.width*.45):0;
        piece.width=Math.min(Math.ceil(canvas.width*.55),canvas.width-x);piece.height=canvas.height;
        piece.getContext('2d').drawImage(canvas,x,0,piece.width,piece.height,0,0,piece.width,piece.height);
        try{const data=await reader.read(piece,true);lines.push(...blockLines(data,piece.width,piece.height,x/canvas.width,piece.width/canvas.width))}finally{piece.width=0;piece.height=0}
      }}finally{canvas.width=0;canvas.height=0}
      pages.push({page,lines});
    }
    return pages;
  }finally{source.close()}
}
export async function cropQuestion(paper,areas){
  if(!areas.length)throw new Error('Bu soru için alan bulunamadı. Öğretmen yardımıyla alanı düzeltin.');
  const source=await openPaper(paper),pieces=[];
  try{
    for(const area of areas){const page=await source.render(area.page);try{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(page.width*area.width));c.height=Math.max(1,Math.round(page.height*area.height));c.getContext('2d').drawImage(page,Math.round(page.width*area.x),Math.round(page.height*area.y),c.width,c.height,0,0,c.width,c.height);pieces.push(c)}finally{page.width=0;page.height=0}}
    const width=Math.max(...pieces.map(c=>c.width)),height=pieces.reduce((n,c)=>n+c.height,0)+24*(pieces.length-1);
    const scale=Math.min(1,2800/height,1800/width),out=document.createElement('canvas');out.width=Math.max(1,Math.round(width*scale));out.height=Math.max(1,Math.round(height*scale));
    const ctx=out.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,out.width,out.height);let y=0;
    for(const piece of pieces){ctx.drawImage(piece,0,Math.round(y*scale),Math.round(piece.width*scale),Math.round(piece.height*scale));y+=piece.height+24}
    return out.toDataURL('image/jpeg',.94);
  }finally{source.close();for(const c of pieces){c.width=0;c.height=0}}
}
