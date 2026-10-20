import {detectQuestionAreas} from './assessment-data.mjs';
export function keyQuestionAreas(pages,count){
 const correction=line=>/^\s*\d+\s*[.)]?\s*SORU\s*PUAN\s*DUZELT/i.test(line.text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i'));
 const areas=detectQuestionAreas(pages.map(page=>({...page,lines:page.lines.filter(line=>!correction(line)).map(line=>({...line,text:line.text.replace(/^\s*[|¦]\s*(?=\d+\s*[).])/,'')}))})),count);
 for(const rows of areas)for(const area of rows){
  // Slightly overlap the next heading rather than clip a tightly written
  // final calculation immediately above it.
  area.height=Math.min(1-area.y,area.height+.025);
  const page=pages.find(p=>p.page===area.page);
  const continuation=page.lines.find(line=>line.x>=area.x&&line.x<area.x+area.width&&line.y>area.y&&line.y<area.y+area.height&&/^\s*[b-h]\s*[).]/i.test(line.text));
  if(area.y===.1&&continuation&&continuation.y>area.y+.03){const bottom=area.y+area.height;area.y=continuation.y-.012;area.height=bottom-area.y}
 }
 // A teacher may add a question-specific correction in a page margin. Keep
 // that labelled correction with its question even in a different column.
 for(const page of pages)for(const line of page.lines){
  const text=line.text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
  const match=text.match(/^\s*(\d+)\s*[.)]?\s*SORU\s*PUAN\s*DUZELT/i);
  if(!match)continue;const n=Number(match[1]);if(n<1||n>count)continue;
  const x=line.x>=.42?.49:0,y=Math.max(0,line.y-.015);
  if(y<.95&&!areas[n-1].some(a=>a.page===page.page&&a.x<=line.x&&a.x+a.width>line.x&&a.y<=line.y&&a.y+a.height>line.y))areas[n-1].push({page:page.page,x,y,width:.51,height:Math.min(.20,.97-y),inferred:true});
 }
 return areas;
}
