export async function studentPdf(source,group,name,signal){
 if(group.count>12)throw new Error('Bir öğrenci için en fazla 12 sayfa destekleniyor.');
 const {jsPDF}=await import('jspdf');let pdf;
 for(let page=group.start;page<=group.end;page++){signal?.throwIfAborted();const c=await source.render(page);try{signal?.throwIfAborted();const width=c.width>c.height?297:210,height=width*c.height/c.width,orientation=width>height?'landscape':'portrait';if(!pdf)pdf=new jsPDF({orientation,unit:'mm',format:[width,height],compress:true});else pdf.addPage([width,height],orientation);pdf.addImage(c.toDataURL('image/jpeg',.9),'JPEG',0,0,width,height,undefined,'FAST')}finally{c.width=c.height=0}}
 const bytes=pdf.output('arraybuffer');if(bytes.byteLength>15*1024*1024)throw new Error('Bu öğrencinin PDF’si 15 MB sınırını aşıyor. Daha düşük çözünürlükle tarayın.');return new File([bytes],name,{type:'application/pdf'});
}
