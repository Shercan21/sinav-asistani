export function frameDescriptor(canvas){
 const c=document.createElement('canvas');c.width=64;c.height=40;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(canvas,0,0,64,40);const d=x.getImageData(0,0,64,40).data,g=new Float32Array(2560);let light=0,ink=0,edges=0;
 for(let i=0;i<g.length;i++){g[i]=.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2];light+=g[i];if(g[i]<170)ink++;if(i%64&&i>=64)edges+=Math.abs(g[i]-g[i-1])+Math.abs(g[i]-g[i-64])}
 return {gray:Array.from(g),light:light/g.length,ink:ink/g.length,edges:edges/g.length};
}
export function frameMotion(a,b){return !a||!b?Infinity:a.reduce((n,v,i)=>n+Math.abs(v-b[i]),0)/a.length}
let patchCanvas,patchContext;
function patch(ctx,a,width,height){if(!patchCanvas){patchCanvas=document.createElement('canvas');patchCanvas.width=24;patchCanvas.height=16;patchContext=patchCanvas.getContext('2d',{willReadFrequently:true})}const c=patchCanvas,x=patchContext;x.clearRect(0,0,24,16);x.drawImage(ctx.canvas,a.x*width,a.y*height,a.width*width,a.height*height,0,0,24,16);const d=x.getImageData(0,0,24,16).data,v=Array.from({length:384},(_,i)=>.299*d[i*4]+.587*d[i*4+1]+.114*d[i*4+2]),mean=v.reduce((n,k)=>n+k,0)/v.length;const sd=Math.sqrt(v.reduce((n,k)=>n+(k-mean)**2,0)/v.length);return {v:v.map(k=>(k-mean)/(sd||1)),sd}}
export function makeAnchor(canvas,area){return patch(canvas.getContext('2d'),area,canvas.width,canvas.height)}
export function findAnchor(canvas,area,reference){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});let best={score:-1,dx:0,dy:0,scale:1};
 for(const scale of [.94,1,1.06])for(const dx of [-.06,-.03,0,.03,.06])for(const dy of [-.06,-.03,0,.03,.06]){
  const a={x:(area.x-.5)*scale+.5+dx,y:(area.y-.5)*scale+.5+dy,width:area.width*scale,height:area.height*scale};if(a.x<0||a.y<0||a.x+a.width>1||a.y+a.height>1)continue;
  const p=patch(ctx,a,canvas.width,canvas.height);if(p.sd<12)continue;const score=p.v.reduce((n,v,i)=>n+v*reference.v[i],0)/p.v.length;if(score>best.score)best={score,dx,dy,scale};
 }
 const coarse={...best};for(const xShift of [-.015,-.0075,0,.0075,.015])for(const yShift of [-.015,-.0075,0,.0075,.015]){const dx=coarse.dx+xShift,dy=coarse.dy+yShift,a={x:(area.x-.5)*coarse.scale+.5+dx,y:(area.y-.5)*coarse.scale+.5+dy,width:area.width*coarse.scale,height:area.height*coarse.scale};if(a.x<0||a.y<0||a.x+a.width>1||a.y+a.height>1)continue;const p=patch(ctx,a,canvas.width,canvas.height);if(p.sd<12)continue;const score=p.v.reduce((n,v,i)=>n+v*reference.v[i],0)/p.v.length;if(score>best.score)best={score,dx,dy,scale:coarse.scale}}return best;
}
export function mappedArea(a,match={dx:0,dy:0,scale:1}){return {...a,x:(a.x-.5)*match.scale+.5+match.dx,y:(a.y-.5)*match.scale+.5+match.dy,width:a.width*match.scale,height:a.height*match.scale}}
export function cropScanField(canvas,a){
 if(a.x<0||a.y<0||a.x+a.width>1.001||a.y+a.height>1.001)throw new Error('Alan çerçevenin dışında kaldı. Kâğıdı yeniden hizalayın.');
 const c=document.createElement('canvas'),w=Math.max(1,Math.round(a.width*canvas.width)),h=Math.max(1,Math.round(a.height*canvas.height)),scale=Math.min(3,700/w,250/h);c.width=Math.round(w*scale)+32;c.height=Math.round(h*scale)+32;
 const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,c.width,c.height);x.drawImage(canvas,a.x*canvas.width,a.y*canvas.height,w,h,16,16,c.width-32,c.height-32);return c;
}
export function cropScanRegion(canvas,a){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(a.width*canvas.width));c.height=Math.max(1,Math.round(a.height*canvas.height));c.getContext('2d').drawImage(canvas,a.x*canvas.width,a.y*canvas.height,c.width,c.height,0,0,c.width,c.height);return c}
export function videoScanFrame(video,aspect){const w=video.videoWidth,h=video.videoHeight;if(!w||!h)return null;const cw=Math.min(w,h*aspect),ch=cw/aspect,c=document.createElement('canvas');c.width=Math.min(1600,Math.round(cw));c.height=Math.round(c.width/aspect);c.getContext('2d').drawImage(video,(w-cw)/2,(h-ch)/2,cw,ch,0,0,c.width,c.height);return c}
export const scanBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Görüntü kaydedilemedi.')),'image/jpeg',.93));
