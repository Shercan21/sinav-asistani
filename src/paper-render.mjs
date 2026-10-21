import {paintMarks} from './paper-marks.mjs';
export async function openPaper(file){
  if(file.type==='application/pdf'){
    const pdfjs=await import('pdfjs-dist');const worker=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');pdfjs.GlobalWorkerOptions.workerSrc=worker.default;
    const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false,enableXfa:false});const document=await loading.promise;
    return {count:document.numPages,close:()=>{void loading.destroy().catch(()=>{})},render:async number=>{const page=await document.getPage(number),initial=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,2000/Math.max(initial.width,initial.height))});const canvas=window.document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;return canvas}};
  }
  const url=URL.createObjectURL(file),image=new Image();try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url})}catch{URL.revokeObjectURL(url);throw new Error('Fotoğraf açılamadı.')}
  return {count:1,close:()=>URL.revokeObjectURL(url),render:async()=>{const scale=Math.min(1,2000/Math.max(image.naturalWidth,image.naturalHeight)),canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);return canvas}};
}
export async function downloadMarkedPaper(source,items,onProgress,scoreReport,scoreMarkers=[]){
  if(source.count>60)throw new Error('Notlu indirme için PDF’yi 60 sayfa veya daha küçük parçalara ayırın.');
  const {jsPDF}=await import('jspdf');let pdf;
  for(let page=1;page<=source.count;page++){onProgress(page,source.count);const canvas=await source.render(page);paintMarks(canvas.getContext('2d'),items,page,canvas.width,canvas.height);const orientation=canvas.width>canvas.height?'landscape':'portrait';if(!pdf)pdf=new jsPDF({orientation,unit:'mm',format:'a4',compress:true});else pdf.addPage('a4',orientation);const width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),scale=Math.min((width-(scoreMarkers.length?32:12))/canvas.width,(height-12)/canvas.height),w=canvas.width*scale,h=canvas.height*scale;pdf.addImage(canvas.toDataURL('image/jpeg',.9),'JPEG',(width-w)/2,(height-h)/2,w,h,undefined,'FAST');const lastY={left:0,right:0};for(const marker of scoreMarkers.filter(m=>m.page===page).sort((a,b)=>a.y-b.y)){const x=marker.side==='left'?7:width-7,y=Math.min(height-10,Math.max(12,(height-h)/2+marker.y*h,lastY[marker.side]+14));lastY[marker.side]=y;pdf.setDrawColor(marker.score===''?'#97604c':'#c62828');pdf.setTextColor(marker.score===''?'#97604c':'#c62828');pdf.setLineWidth(.4);pdf.circle(x,y,4.5);pdf.setFontSize(9);pdf.text(marker.score===''?'X':Number(marker.score).toLocaleString('tr-TR'),x,y+1,{align:'center'});pdf.setFontSize(7);pdf.text('S'+marker.question,x,y-6,{align:'center'})}canvas.width=0;canvas.height=0}
  if(scoreReport){
    const lines=['Değerlendirme çalışma puanları',...scoreReport,'Resmî not için sonuç formundaki kayıt esas alınır.'];
    for(let offset=0;offset<lines.length;offset+=38){const canvas=document.createElement('canvas');canvas.width=1240;canvas.height=1754;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1240,1754);ctx.fillStyle='#111827';ctx.font='26px sans-serif';lines.slice(offset,offset+38).forEach((line,i)=>ctx.fillText(line,70,85+i*40));pdf.addPage('a4','portrait');pdf.addImage(canvas.toDataURL('image/jpeg',.92),'JPEG',0,0,210,297);canvas.width=0;canvas.height=0}
  }
  pdf.save('notlu-sinav-kagidi.pdf');
}
