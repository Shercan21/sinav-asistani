export const PHOTO_TYPES=['image/jpeg','image/png','image/webp'];
export const MAX_PAGES=12;
function imageFromUrl(url){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('Fotoğraf açılamadı. JPG, PNG veya WebP kullanın.'));image.src=url})}
export function canvasPhoto(source,width,height,quality=.88){
  const scale=Math.min(1,2200/Math.max(width,height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Fotoğraf hazırlanamadı.');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0,canvas.width,canvas.height);
  return {id:crypto.randomUUID(),data:canvas.toDataURL('image/jpeg',quality),width:canvas.width,height:canvas.height};
}
export async function photoFromFile(file){
  if(!PHOTO_TYPES.includes(file.type)||file.size>25*1024*1024)throw new Error('Her fotoğraf JPG, PNG veya WebP biçiminde ve en fazla 25 MB olmalı.');
  const url=URL.createObjectURL(file);try{const image=await imageFromUrl(url);if(image.naturalWidth*image.naturalHeight>50000000)throw new Error('Fotoğraf çözünürlüğü çok büyük. Daha küçük bir fotoğraf seçin.');return canvasPhoto(image,image.naturalWidth,image.naturalHeight)}finally{URL.revokeObjectURL(url)}
}
export async function rotatePhoto(page){const image=await imageFromUrl(page.data),canvas=document.createElement('canvas');canvas.width=page.height;canvas.height=page.width;const ctx=canvas.getContext('2d');ctx.translate(canvas.width/2,canvas.height/2);ctx.rotate(Math.PI/2);ctx.drawImage(image,-page.width/2,-page.height/2);return {...page,data:canvas.toDataURL('image/jpeg',.9),width:canvas.width,height:canvas.height}}
export async function pagesToPdf(pages,compact=true){
  if(!pages.length||pages.length>MAX_PAGES)throw new Error(`1–${MAX_PAGES} sayfa hazırlayın.`);
  const {jsPDF}=await import('jspdf');
  const pdf=new jsPDF({orientation:pages[0].width>pages[0].height?'landscape':'portrait',unit:'mm',format:'a4',compress:true});
  for(let i=0;i<pages.length;i++){
    const page=pages[i];if(i)pdf.addPage('a4',page.width>page.height?'landscape':'portrait');
    const width=pdf.internal.pageSize.getWidth(),height=pdf.internal.pageSize.getHeight(),scale=Math.min((width-12)/page.width,(height-12)/page.height);
    const image=compact?canvasPhoto(await imageFromUrl(page.data),page.width,page.height,.72).data:page.data;
    const w=page.width*scale,h=page.height*scale;pdf.addImage(image,'JPEG',(width-w)/2,(height-h)/2,w,h,undefined,'FAST');
  }
  const file=new File([pdf.output('arraybuffer')],`sinav-kagidi-${Date.now()}.pdf`,{type:'application/pdf'});
  if(file.size>15*1024*1024)throw new Error('PDF 15 MB sınırını aşıyor. Daha az sayfa veya küçük dosya seçeneğiyle hazırlayın.');
  return file;
}

export function brightenCanvas(canvas){
  const ctx=canvas.getContext('2d'),image=ctx.getImageData(0,0,canvas.width,canvas.height);
  for(let i=0;i<image.data.length;i+=4)for(let c=0;c<3;c++)image.data[i+c]=Math.min(255,Math.round(image.data[i+c]*1.18));
  ctx.putImageData(image,0,0);return canvas;
}
export async function brightenPhoto(page){
  const image=await imageFromUrl(page.data),canvas=document.createElement('canvas');canvas.width=page.width;canvas.height=page.height;canvas.getContext('2d').drawImage(image,0,0);brightenCanvas(canvas);
  return {...page,data:canvas.toDataURL('image/jpeg',.94)};
}
