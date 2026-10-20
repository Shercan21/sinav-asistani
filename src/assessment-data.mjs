export function emptyReading(count){return {fullText:'',answers:Array.from({length:count},(_,i)=>({question:i+1,text:'',choice:'?',unclear:true}))}}
export function detectQuestionAreas(pages,count,layout='auto'){
  const areas=Array.from({length:count},()=>[]),columns=[],candidates=[];let previous=null;
  for(const page of pages){
    const anchors=page.lines.map(line=>{const match=line.text.match(/^\s*(\d{1,3})\s*[).]\s*/);return match?{question:Number(match[1]),x:line.x,y:line.y}:null}).filter(a=>a&&a.question>=1&&a.question<=count&&a.y>.045);
    const split=layout==='two'||(layout==='auto'&&anchors.some(a=>a.x>.42)&&anchors.some(a=>a.x<.35));
    for(const col of (split?[0,1]:[0])){
      const left=split?(col===0?0:.49):0,right=split?(col===0?.51:1):1;
      const list=anchors.filter(a=>!split||(col===0?a.x<.42:a.x>=.42)).sort((a,b)=>a.y-b.y);
      const group={page:page.page,left,right,anchors:[]};columns.push(group);
      for(const anchor of list){const item={...anchor,group,margin:Math.abs(anchor.x-left)};group.anchors.push(item);candidates.push(item)}
    }
  }
  // Formula lines can look like "3)". Select the longest increasing question
  // sequence across columns/pages before cutting; prefer column-margin labels
  // when duplicate candidates provide equally complete sequences.
  const paths=[];
  candidates.forEach((candidate,i)=>{
    let path={items:[candidate],penalty:candidate.margin};
    for(let j=0;j<i;j++)if(candidates[j].question<candidate.question){
      const next={items:[...paths[j].items,candidate],penalty:paths[j].penalty+candidate.margin};
      if(next.items.length>path.items.length||(next.items.length===path.items.length&&next.penalty<path.penalty))path=next;
    }
    paths.push(path);
  });
  const best=paths.reduce((best,path)=>path.items.length>best.items.length||(path.items.length===best.items.length&&path.penalty<best.penalty)?path:best,{items:[],penalty:Infinity});
  const selected=new Set(best.items);
  for(const group of columns){
      const {left,right}=group,unique=group.anchors.filter(a=>selected.has(a));
      if(previous&&unique.length&&unique[0].y>.22){
        // A continuation at the top of a new column/page belongs to the last
        // question in reading order. Teacher reviews every inferred region.
        areas[previous-1].push({page:group.page,x:left,y:.10,width:right-left,height:Math.max(.02,unique[0].y-.115),inferred:true});
      }
      unique.forEach((a,i)=>{
        const y=Math.max(0,a.y-.012),bottom=i+1<unique.length?unique[i+1].y-.012:.97;
        if(bottom>y+.02)areas[a.question-1].push({page:group.page,x:left,y,width:right-left,height:bottom-y,inferred:true});
        previous=a.question;
      });
  }
  return areas;
}
export function validArea(area){return area&&Number.isInteger(area.page)&&area.page>=1&&area.page<=12&&['x','y','width','height'].every(k=>typeof area[k]==='number'&&Number.isFinite(area[k]))&&area.x>=0&&area.y>=0&&area.width>=.005&&area.height>=.005&&area.x+area.width<=1.001&&area.y+area.height<=1.001}
export function validScores(scores,key){return Array.isArray(scores)&&scores.length===key.length&&scores.every((s,i)=>s!==''&&s!==null&&s!==undefined&&Number.isFinite(Number(s))&&Number(s)>=0&&Number(s)<=Number(key[i].max))}
export function rubricTotal(rows,max){
  if(!rows.length||rows.some(r=>typeof r.label!=='string'||!r.label.trim()||r.label.length>1000||r.max===''||!Number.isFinite(Number(r.max))||Number(r.max)<=0||r.score===''||!Number.isFinite(Number(r.score))||Number(r.score)<0||Number(r.score)>Number(r.max)))return null;
  if(Math.abs(rows.reduce((n,r)=>n+Number(r.max),0)-max)>.001)return null;
  return Math.round(rows.reduce((n,r)=>n+Number(r.score),0)*100)/100;
}
export function validateWorkflow(value,count){
  if(value?.context!==undefined&&(typeof value.context!=='string'||!/^[a-f0-9]{64}$/.test(value.context)))throw new Error('Çalışma bağlamı geçersiz.');
  if(!value||value.version!==1||!['auto','semi','manual'].includes(value.mode)||!['gemini','local'].includes(value.engine)||!['whole','question','rubric'].includes(value.scope)||!Array.isArray(value.areas)||value.areas.length!==count||!Array.isArray(value.scores)||value.scores.length!==count||!Array.isArray(value.checked)||value.checked.length!==count||value.checked.some(x=>typeof x!=='boolean')||!Array.isArray(value.criteria)||value.criteria.length!==count)throw new Error('Çalışma taslağı geçersiz.');
  if(value.areas.some(rows=>!Array.isArray(rows)||rows.length>24||rows.some(a=>!validArea(a)))||value.scores.some(s=>s!==''&&(typeof s!=='number'||!Number.isFinite(s)||s<0||s>100)))throw new Error('Çalışma taslağı geçersiz.');
  for(const rows of value.criteria){if(!Array.isArray(rows)||rows.length>40||rows.some(r=>!r||typeof r.label!=='string'||r.label.length>1000||!['number','string'].includes(typeof r.max)||!['number','string'].includes(typeof r.score)||[r.max,r.score].some(v=>v!==''&&(!Number.isFinite(Number(v))||Number(v)<0||Number(v)>100))||(r.max!==''&&Number(r.max)<=0)||(r.max!==''&&r.score!==''&&Number(r.score)>Number(r.max))||JSON.stringify(r).length>1500))throw new Error('Rubrik taslağı geçersiz.')}
  return value;
}
