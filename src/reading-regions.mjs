import {openPaper} from './paper-render.mjs';
export async function readingRegions(file,signal,onProgress){
  const source=await openPaper(file),regions=[];
  try{
    if(source.count>12)throw new Error('Ayrıntılı okuma için dosyayı en fazla 12 sayfalık parçalara ayırın veya ayrıntılı okuma seçeneğini kapatın.');
    for(let page=1;page<=source.count;page++){
      signal?.throwIfAborted();onProgress?.(page,source.count);
      const full=await source.render(page);
      try{
        for(const side of ['left','right']){
          const canvas=document.createElement('canvas'),x=side==='left'?0:Math.floor(full.width*.45);
          canvas.width=Math.ceil(full.width*.55);canvas.height=full.height;
          const width=Math.min(canvas.width,full.width-x);
          canvas.width=width;canvas.getContext('2d').drawImage(full,x,0,width,full.height,0,0,width,full.height);
          regions.push({page,side,mimeType:'image/jpeg',base64:canvas.toDataURL('image/jpeg',.92).split(',')[1]});
          canvas.width=0;canvas.height=0;
        }
      }finally{full.width=0;full.height=0}
    }
    signal?.throwIfAborted();
    if(regions.reduce((sum,r)=>sum+r.base64.length,0)+Math.ceil(file.size*4/3)>14*1024*1024)throw new Error('Ayrıntılı okuma görüntüleri çok büyük. Daha az sayfa seçin veya ayrıntılı okumayı kapatın.');
    return regions;
  }finally{source.close()}
}
