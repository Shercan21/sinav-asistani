import {mappedArea} from './scan-vision.mjs';
import {validArea} from './assessment-data.mjs';
export function identityAnchorArea(regions,page){
 const fields=Object.values(regions||{}).flat().filter(a=>a.page===page);if(!fields.length)return null;
 const top=Math.min(...fields.map(a=>a.y)),left=Math.min(...fields.map(a=>a.x)),right=Math.max(...fields.map(a=>a.x+a.width));
 const area={page,x:Math.max(.03,left),y:Math.max(0,top-.09),width:Math.min(.96,right)-Math.max(.03,left),height:Math.min(.085,top-Math.max(0,top-.09))};return validArea(area)?area:null;
}
let descriptorCanvas,descriptorContext;
function descriptor(canvas,area){if(!descriptorCanvas){descriptorCanvas=document.createElement('canvas');descriptorCanvas.width=96;descriptorCanvas.height=28;descriptorContext=descriptorCanvas.getContext('2d',{willReadFrequently:true})}const x=descriptorContext;x.fillStyle='white';x.fillRect(0,0,96,28);x.drawImage(canvas,area.x*canvas.width,area.y*canvas.height,area.width*canvas.width,area.height*canvas.height,0,0,96,28);const p=x.getImageData(0,0,96,28).data,v=new Float32Array(96*28);let sum=0;for(let i=0;i<v.length;i++){v[i]=.299*p[i*4]+.587*p[i*4+1]+.114*p[i*4+2];sum+=v[i]}const mean=sum/v.length;let variance=0;for(let i=0;i<v.length;i++){v[i]-=mean;variance+=v[i]*v[i]}const sd=Math.sqrt(variance/v.length);if(sd)for(let i=0;i<v.length;i++)v[i]/=sd;return{v,sd}}
export function makeIdentityAnchor(canvas,regions,page){let area=identityAnchorArea(regions,page);if(!area)return null;
 // Match the printed title, not the outer photo margin or a pupil's handwriting.
 const left=Math.max(area.x,.25),right=Math.min(.72,area.x+area.width);if(right-left>=.15)area={...area,x:left,width:right-left};if(!validArea(area))return null;
 const x=Math.round(area.x*canvas.width),y=Math.round(area.y*canvas.height),w=Math.round(area.width*canvas.width),h=Math.round(area.height*canvas.height),pixels=canvas.getContext('2d',{willReadFrequently:true}).getImageData(x,y,w,h).data;let first=h,last=-1;const inkRows=[];
 for(let row=0;row<h;row++){let ink=0;for(let col=0;col<w;col++){const i=(row*w+col)*4;if(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]<150)ink++}if(ink>=6){first=Math.min(first,row);last=row;inkRows.push(row)}}
 if(last<first)return null;first=last;for(let i=inkRows.length-2;i>=0;i--){if(first-inkRows[i]>4)break;first=inkRows[i]}const top=Math.max(0,first-3),bottom=Math.min(h,last+4);area={...area,y:(y+top)/canvas.height,height:(bottom-top)/canvas.height};if(!validArea(area))return null;
 const d=descriptor(canvas,area);return d.sd>=8?{area,...d}:null}
export function alignIdentityPage(canvas,anchor){
 if(!anchor)return{score:0,dx:0,dy:0,scale:1};let best={score:-1,dx:0,dy:0,scale:1};
 const check=(dx,dy,scale)=>{const area=mappedArea(anchor.area,{dx,dy,scale});if(!validArea(area))return;const d=descriptor(canvas,area);if(d.sd<8)return;let score=0;for(let i=0;i<d.v.length;i++)score+=d.v[i]*anchor.v[i];score/=d.v.length;if(score>best.score)best={score,dx,dy,scale}};
 for(const scale of [.88,.94,1,1.06,1.12])for(const dx of Array.from({length:13},(_,i)=>(i-6)*.01))for(const dy of Array.from({length:61},(_,i)=>(i-30)*.003))check(dx,dy,scale);
 const coarse={...best};for(const scale of [coarse.scale-.02,coarse.scale,coarse.scale+.02])for(const dx of [-.015,-.0075,0,.0075,.015])for(const dy of [-.003,-.0015,0,.0015,.003])check(coarse.dx+dx,coarse.dy+dy,scale);
 return best;
}
export function mapIdentityRegions(regions,matches){return Object.fromEntries(Object.entries(regions||{}).map(([field,areas])=>[field,areas.map(a=>{const match=matches[a.page],mapped=match&&match.score>=.55?mappedArea(a,match):null;return mapped&&validArea(mapped)?mapped:a})]))}
