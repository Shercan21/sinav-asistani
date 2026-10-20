export function scoreSummary(scores,key){
  let total=0,completed=0,invalid=false;
  scores.forEach((s,i)=>{if(s===''||s===null||s===undefined)return;const n=Number(s);if(!Number.isFinite(n)||n<0||n>Number(key[i].max)){invalid=true;return}total+=n;completed++});
  return {total:Math.round(total*100)/100,max:Math.round(key.reduce((n,k)=>n+Number(k.max),0)*100)/100,completed,invalid};
}
export function assessmentScoreMarks(scores,key,areas){
  const summary=scoreSummary(scores,key);
  if(summary.invalid||summary.completed!==key.length)throw new Error('Tüm soru puanlarını geçerli olarak doldurun.');
  const mark=(id,text,page,x,y,size=.018)=>({id,page,kind:'text',text,x,y,size,color:'#c62828'});
  return scores.flatMap((score,i)=>{
    const area=areas[i]?.[0],text=`S${i+1}: ${Number(score).toLocaleString('tr-TR')} / ${Number(key[i].max).toLocaleString('tr-TR')}`;
    return area?[mark(`assessment-score-${i}`,text,area.page,Math.min(.8,area.x+.01),Math.max(.005,area.y-.025))]:[];
  });
}
