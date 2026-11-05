export function parseCriterionAlternatives(text){
 const seen=new Set(),rows=String(text).split(/\r?\n/).map(s=>s.trim()).filter(Boolean).filter(s=>{const key=s.normalize('NFKC').toLocaleLowerCase('tr-TR');if(seen.has(key))return false;seen.add(key);return true});
 validateCriterionAlternatives(rows);return rows;
}
export function validateCriterionAlternatives(rows){
 if(rows===undefined)return;
 if(!Array.isArray(rows)||rows.length>20||rows.some(s=>typeof s!=='string'||!s.trim()||s.length>200))throw new Error('Bir ölçüte en fazla 20 alternatif yazın; her biri en fazla 200 karakter olsun.');
}
export function studentComparisonAreas(areas){
 const groups=new Map();for(const a of areas){const key=`${a.page}:${a.answerAreaId||''}`;const rows=groups.get(key)||[];rows.push(a);groups.set(key,rows)}
 return [...groups.values()].map(rows=>{if(rows.length===1)return rows[0];const x=Math.min(...rows.map(a=>a.x)),y=Math.min(...rows.map(a=>a.y));return {...rows[0],id:`comparison-${rows[0].id||rows[0].page}`,x,y,width:Math.max(...rows.map(a=>a.x+a.width))-x,height:Math.max(...rows.map(a=>a.y+a.height))-y}});
}
