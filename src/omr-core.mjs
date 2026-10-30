export const OMR_WIDTH=1200, OMR_HEIGHT=1697;
export function omrConfig(questions,choices){
 if(!Number.isInteger(questions)||questions<1||questions>100||!Number.isInteger(choices)||choices<2||choices>5)throw new Error('Soru sayısı 1–100, şık sayısı 2–5 olmalı.');
 return {questions,choices};
}
export function omrLayout(questions,choices){
 omrConfig(questions,choices);const columns=Math.ceil(questions/25),columnWidth=1040/columns,dx=Math.min(43,(columnWidth-55)/choices),radius=Math.min(15,dx*.32);
 return Array.from({length:questions},(_,i)=>{const column=Math.floor(i/25),row=i%25;return {question:i+1,y:360+row*45,cells:Array.from({length:choices},(_,j)=>({x:105+column*columnWidth+42+j*dx,y:360+row*45,radius}))}});
}
export const omrCorners=[{x:60,y:60},{x:1140,y:60},{x:1140,y:1637},{x:60,y:1637}];
export function omrCode(questions,choices){omrConfig(questions,choices);return [1,0,1,1,0,1,...questions.toString(2).padStart(7,'0').split('').map(Number),...choices.toString(2).padStart(3,'0').split('').map(Number)]}
export function verifyOmrCode({data,width,height},corners,questions,choices){const map=omrTransform(corners),bits=omrCode(questions,choices);for(let i=0;i<bits.length;i++){const p=map(430+22*i,185),x=Math.round(p.x),y=Math.round(p.y);if(x<1||y<1||x>=width-1||y>=height-1)throw new Error('Form kodu fotoğrafın dışında.');let sum=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const k=((y+dy)*width+x+dx)*4;sum+=(data[k]+data[k+1]+data[k+2])/3}if(Number(sum/9<150)!==bits[i])throw new Error('Form kodu soru / şık sayısıyla eşleşmiyor veya net değil. Doğru formu seçip köşeleri kontrol edin.')}}
// Projective map from the canonical four registration marks to camera coordinates.
export function omrTransform(corners,source=omrCorners){
 if(!Array.isArray(corners)||corners.length!==4||corners.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Dört köşe işaretini sırayla seçin.');
 let sign=0;for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4],c=corners[(i+2)%4],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)<20||sign&&Math.sign(cross)!==sign)throw new Error('Köşeler kesişiyor veya alan çok küçük.');sign=Math.sign(cross)}if(sign<0)throw new Error('Köşeleri sol üstten saat yönünde seçin.');
 const rows=[];for(let i=0;i<4;i++){const {x,y}=source[i],{x:u,y:v}=corners[i];rows.push([x,y,1,0,0,0,-u*x,-u*y,u],[0,0,0,x,y,1,-v*x,-v*y,v])}
 for(let col=0;col<8;col++){let pivot=col;for(let i=col+1;i<8;i++)if(Math.abs(rows[i][col])>Math.abs(rows[pivot][col]))pivot=i;[rows[col],rows[pivot]]=[rows[pivot],rows[col]];const d=rows[col][col];if(Math.abs(d)<1e-9)throw new Error('Köşe dönüşümü hesaplanamadı.');for(let j=col;j<=8;j++)rows[col][j]/=d;for(let i=0;i<8;i++)if(i!==col){const n=rows[i][col];for(let j=col;j<=8;j++)rows[i][j]-=n*rows[col][j]}}
 const h=rows.map(r=>r[8]);return (x,y)=>{const d=h[6]*x+h[7]*y+1;return {x:(h[0]*x+h[1]*y+h[2])/d,y:(h[3]*x+h[4]*y+h[5])/d}};
}
export function classifyBubble(fills){
 const sorted=fills.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v),first=sorted[0],second=sorted[1];
 if(first.v<.12)return {answer:'',state:'blank'};
 if(first.v<.4)return {answer:'',state:'uncertain'};
 if(second.v>=.32||first.v-second.v<.22)return {answer:'',state:'multiple'};
 return {answer:String.fromCharCode(65+first.i),state:'marked'};
}
export const pageCorners=[{x:0,y:0},{x:OMR_WIDTH,y:0},{x:OMR_WIDTH,y:OMR_HEIGHT},{x:0,y:OMR_HEIGHT}];
export function customOmrLayout(blocks,questions,choices){
 omrConfig(questions,choices);const rows=[];
 for(const b of blocks){if(!Number.isInteger(b.start)||!Number.isInteger(b.end)||b.start<1||b.end>questions||b.end<b.start||b.x<0||b.y<0||b.width<=0||b.height<=0||b.x+b.width>1.001||b.y+b.height>1.001)throw new Error('Cevap bloklarını ve soru aralıklarını kontrol edin.');const n=b.end-b.start+1,dx=b.width*OMR_WIDTH/choices,dy=b.height*OMR_HEIGHT/n;for(let i=0;i<n;i++)rows.push({question:b.start+i,y:(b.y*OMR_HEIGHT+(i+.5)*dy),cells:Array.from({length:choices},(_,j)=>({x:b.x*OMR_WIDTH+(j+.5)*dx,y:b.y*OMR_HEIGHT+(i+.5)*dy,radius:Math.min(dx,dy)*.28}))})}
 rows.sort((a,b)=>a.question-b.question);if(rows.length!==questions||rows.some((r,i)=>r.question!==i+1))throw new Error('Her soruyu bir kez kapsayan cevap blokları tanıtın.');return rows;
}
export function readOmrPixels({data,width,height},corners,questions,choices,blocks,baseline){
 const map=omrTransform(corners,blocks?pageCorners:omrCorners),gray=(x,y)=>{const p=map(x,y),ix=Math.round(p.x),iy=Math.round(p.y);if(ix<0||iy<0||ix>=width||iy>=height)throw new Error('Optik alan fotoğrafın dışında kaldı.');const k=(iy*width+ix)*4;return .299*data[k]+.587*data[k+1]+.114*data[k+2]};
 return (blocks?customOmrLayout(blocks,questions,choices):omrLayout(questions,choices)).map(row=>{const fills=row.cells.map((c,j)=>{let dark=0,soft=0,n=0;const backgrounds=[];for(let j=0;j<24;j++){const angle=j*Math.PI/12;backgrounds.push(gray(c.x+Math.cos(angle)*c.radius*1.35,c.y+Math.sin(angle)*c.radius*1.35))}backgrounds.sort((a,b)=>a-b);const white=backgrounds[18];if(white<110)throw new Error('Görüntü çok karanlık. Aydınlık ortamda tekrar çekin.');const threshold=Math.max(55,Math.min(180,white-55));for(let y=-5;y<=5;y++)for(let x=-5;x<=5;x++)if(x*x+y*y<=25){n++;const g=gray(c.x+x*c.radius*.11,c.y+y*c.radius*.11);if(g<threshold)dark++;if(g<Math.min(230,threshold+40))soft++}const raw=dark/n<.12&&soft/n>.65?.2:dark/n,base=baseline?.[row.question-1]?.[j]||0;return Math.max(0,(raw-base)/Math.max(.1,1-base))});return {...classifyBubble(fills),question:row.question,fills}});
}
export function gradeOmr(answers,key,choices){
 if(!Array.isArray(key)||!key.length||key.some(v=>!new RegExp(`^[A-${String.fromCharCode(64+choices)}]$`).test(v)))throw new Error('Her sorunun cevap anahtarını seçin.');
 if(answers.length!==key.length)throw new Error('Soru sayısı eşleşmiyor.');let correct=0,wrong=0,blank=0,pending=0;
 answers.forEach((a,i)=>{if(!['marked','blank'].includes(a.state)){pending++;return}if(a.state==='blank'){blank++;return}if(a.answer===key[i])correct++;else wrong++});return {correct,wrong,blank,pending,score:Math.round(correct/key.length*10000)/100};
}

