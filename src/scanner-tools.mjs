// All image processing stays on the device. Points are TL, TR, BR, BL.
export const fullCorners=()=>[[0,0],[1,0],[1,1],[0,1]];
export function validCorners(points){
  if(points.length!==4||points.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))return false;
  let area=0;
  for(let i=0;i<4;i++){
    const a=points[i],b=points[(i+1)%4],c=points[(i+2)%4];
    if((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])<=.0001)return false;
    area+=a[0]*b[1]-b[0]*a[1];
  }
  return area/2>.04;
}
function load(data){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Fotoğraf açılamadı.'));im.src=data})}
export async function suggestCorners(page){
  const image=await load(page.data),canvas=document.createElement('canvas');
  canvas.width=240;canvas.height=Math.max(80,Math.round(240*page.height/page.width));
  const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);
  const {data}=ctx.getImageData(0,0,canvas.width,canvas.height),w=canvas.width,h=canvas.height;
  const light=(x,y)=>{const i=(y*w+x)*4;return .299*data[i]+.587*data[i+1]+.114*data[i+2]};
  let border=0,count=0;
  for(let x=0;x<w;x+=4){border+=light(x,0)+light(x,h-1);count+=2}
  for(let y=0;y<h;y+=4){border+=light(0,y)+light(w-1,y);count+=2}
  const threshold=Math.max(145,border/count+28),candidates=[];
  for(let y=2;y<h-2;y+=2)for(let x=2;x<w-2;x+=2)if(light(x,y)>threshold)candidates.push([x/(w-1),y/(h-1)]);
  if(candidates.length<100)return null;
  const scores=[p=>p[0]+p[1],p=>-p[0]+p[1],p=>-p[0]-p[1],p=>p[0]-p[1]];
  const points=scores.map(score=>candidates.reduce((best,p)=>score(p)<score(best)?p:best));
  return validCorners(points)?points:null;
}
// Solve the projective map from a unit output rectangle into the source quad.
export function projectiveMap(points){
  if(!validCorners(points))throw new Error('Dört köşeyi kâğıdın etrafında, birbirini kesmeyecek şekilde yerleştirin.');
  const matrix=[];
  [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{const [x,y]=points[i];matrix.push([u,v,1,0,0,0,-u*x,-v*x,x],[0,0,0,u,v,1,-u*y,-v*y,y])});
  for(let col=0;col<8;col++){
    let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(matrix[row][col])>Math.abs(matrix[pivot][col]))pivot=row;
    if(Math.abs(matrix[pivot][col])<1e-10)throw new Error('Köşeler birbirine çok yakın.');
    [matrix[col],matrix[pivot]]=[matrix[pivot],matrix[col]];
    const n=matrix[col][col];for(let j=col;j<=8;j++)matrix[col][j]/=n;
    for(let row=0;row<8;row++)if(row!==col){const factor=matrix[row][col];for(let j=col;j<=8;j++)matrix[row][j]-=factor*matrix[col][j]}
  }
  const a=matrix.map(row=>row[8]);
  return (u,v)=>{const d=a[6]*u+a[7]*v+1;return [(a[0]*u+a[1]*v+a[2])/d,(a[3]*u+a[4]*v+a[5])/d]};
}
export async function flattenPhoto(page,points,enhance=false){
  const map=projectiveMap(points),image=await load(page.data);
  const source=document.createElement('canvas');source.width=page.width;source.height=page.height;
  const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0,page.width,page.height);
  const input=ctx.getImageData(0,0,page.width,page.height).data;
  const distance=(a,b)=>Math.hypot((a[0]-b[0])*page.width,(a[1]-b[1])*page.height);
  let width=Math.round(Math.max(distance(points[0],points[1]),distance(points[3],points[2])));
  let height=Math.round(Math.max(distance(points[0],points[3]),distance(points[1],points[2])));
  const scale=Math.min(1,2200/Math.max(width,height));width=Math.max(2,Math.round(width*scale));height=Math.max(2,Math.round(height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const out=canvas.getContext('2d'),pixels=out.createImageData(width,height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const [sx,sy]=map(x/(width-1),y/(height-1));
    const fx=Math.max(0,Math.min(page.width-1,sx*(page.width-1))),fy=Math.max(0,Math.min(page.height-1,sy*(page.height-1)));
    const ix=Math.floor(fx),iy=Math.floor(fy),dx=fx-ix,dy=fy-iy;
    const a=(iy*page.width+ix)*4,b=(iy*page.width+Math.min(ix+1,page.width-1))*4;
    const c=(Math.min(iy+1,page.height-1)*page.width+ix)*4,d=(Math.min(iy+1,page.height-1)*page.width+Math.min(ix+1,page.width-1))*4;
    const offset=(y*width+x)*4;
    for(let channel=0;channel<3;channel++){
      let value=input[a+channel]*(1-dx)*(1-dy)+input[b+channel]*dx*(1-dy)+input[c+channel]*(1-dx)*dy+input[d+channel]*dx*dy;
      if(enhance)value=(value-128)*1.12+140;
      pixels.data[offset+channel]=value;
    }
    pixels.data[offset+3]=255;
  }
  out.putImageData(pixels,0,0);
  return {...page,width,height,data:canvas.toDataURL('image/jpeg',.92)};
}
