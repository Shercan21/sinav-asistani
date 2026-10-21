export const paperTones={original:'none',light:'brightness(1.18) contrast(1.08)',dark:'brightness(0.82) contrast(1.2)',contrast:'grayscale(1) contrast(1.8) brightness(1.05)'};
export function toneFilter(tone){return paperTones[tone]||paperTones.original}
export async function applyPaperTone(url,tone='original'){
 if(toneFilter(tone)==='none')return url;
 const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Görüntü düzenlenemedi.'));image.src=url});
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const ctx=canvas.getContext('2d');ctx.filter=toneFilter(tone);ctx.drawImage(image,0,0);const result=canvas.toDataURL('image/png');canvas.width=canvas.height=0;return result;
}
