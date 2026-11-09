export const buttonLayout={width:280,height:30,buttons:[['Girdi',50,'#00966B','#ECFDF5','#6EE7B7'],['Girmedi',68,'#145CD6','#EFF6FF','#BFDBFE'],['Muaf',54,'#D97706','#FFFBEB','#FDE68A'],['Kopya',60,'#C91D2A','#FFF1F2','#FECDD3']]};
export function participationButtonSvg(selected){
 let x=8;const parts=buttonLayout.buttons.map(([label,width,active,pale,border])=>{const chosen=label===selected,rect=`<rect x="${x}" y="3" width="${width}" height="24" rx="12" fill="${chosen?active:pale}" stroke="${chosen?active:border}" stroke-width="${chosen?2:1}"/><text x="${x+width/2}" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" font-weight="${chosen?700:400}" fill="${chosen?'#FFFFFF':active}">${label}</text>`;x+=width+6;return rect;});
 return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="30" viewBox="0 0 280 30"><rect width="280" height="30" fill="white"/>${parts.join('')}</svg>`;
}
export async function renderParticipationButtons(status){
 const image=new Image(),url=URL.createObjectURL(new Blob([participationButtonSvg(status)],{type:'image/svg+xml'}));
 try{image.src=url;await image.decode();const c=document.createElement('canvas');c.width=560;c.height=60;c.getContext('2d').drawImage(image,0,0,560,60);return c.toDataURL('image/png');}finally{URL.revokeObjectURL(url);}
}
