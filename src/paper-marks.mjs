export const bound=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
let measureContext;
export function markTextLayout(mark,width,height,context){
  if(!context&&typeof document!=='undefined')measureContext??=document.createElement('canvas').getContext('2d');
  const ctx=context||measureContext,fontSize=mark.size*width,lineHeight=fontSize*1.25;
  if(ctx)ctx.font=`${fontSize}px sans-serif`;
  const measure=text=>ctx?ctx.measureText(text).width:text.length*fontSize*.6;
  const x=bound(mark.x,0,.9)*width,maxWidth=Math.max(fontSize,width-x-2),lines=[];
  for(const paragraph of mark.text.split('\n')){let line='';for(const letter of paragraph){while(line&&measure(line+letter)>maxWidth){const split=line.lastIndexOf(' ');if(split>0){lines.push(line.slice(0,split+1));line=line.slice(split+1)}else{lines.push(line);line=''}}line+=letter}lines.push(line)}
  const y=Math.max(0,Math.min(mark.y*height,height-lines.length*lineHeight));
  return {x,y,lines,fontSize,lineHeight};
}
export function validateMarks(saved){
  if(!saved||!/^[a-f0-9]{64}$/.test(saved.paperFingerprint)||!Array.isArray(saved.items)||saved.items.length>500)throw new Error('Kâğıt notları okunamadı.');
  const point=p=>p&&Number.isFinite(p.x)&&p.x>=0&&p.x<=1&&Number.isFinite(p.y)&&p.y>=0&&p.y<=1;
  for(const mark of saved.items){if(!mark||typeof mark.id!=='string'||!Number.isInteger(mark.page)||mark.page<1||!/^#[a-f0-9]{6}$/i.test(mark.color))throw new Error('Kâğıt notu geçersiz.');if(mark.kind==='text'){if(!point(mark)||typeof mark.text!=='string'||mark.text.length>1000||!Number.isFinite(mark.size)||mark.size<.008||mark.size>.1)throw new Error('Yazı notu geçersiz.')}else if(mark.kind==='pen'){if(!Array.isArray(mark.points)||mark.points.length<2||mark.points.length>1500||!mark.points.every(point))throw new Error('Kalem notu geçersiz.')}else throw new Error('Not türü geçersiz.')}
  return saved;
}
export function paintMarks(ctx,items,page,width,height){
  ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
  for(const mark of items.filter(item=>item.page===page)){ctx.fillStyle=mark.color;ctx.strokeStyle=mark.color;if(mark.kind==='text'){const layout=markTextLayout(mark,width,height,ctx);ctx.textBaseline='top';layout.lines.forEach((line,index)=>ctx.fillText(line,layout.x,layout.y+index*layout.lineHeight))}else{ctx.lineWidth=width*.003;ctx.beginPath();mark.points.forEach((point,index)=>ctx[index?'lineTo':'moveTo'](point.x*width,point.y*height));ctx.stroke()}}
  ctx.restore();
}
