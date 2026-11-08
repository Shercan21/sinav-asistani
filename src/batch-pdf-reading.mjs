import {validateEvaluation} from './visual-assessment.mjs';
import {proposalContext} from './local-key-compare.mjs';
export function bulkReadingDraft(draft,result){
 const next=structuredClone(draft),count=next.manualScores.length;
 if(!Array.isArray(result.answers)||result.answers.length!==count||new Set(result.answers.map(a=>a.question)).size!==count)throw new Error('Toplu okuma sonucu eksik.');
 for(const row of result.answers){const i=row.question-1;if(i<0||i>=count||!row.regions?.length)throw new Error('Toplu okuma soru numarası geçersiz.');next.areas[i]=(row.studentAreas||[]).map(a=>({...a,id:crypto.randomUUID()}));const known=row.regions.filter(r=>r.score!=='');next.manualScores[i]=known.length?Math.round(known.reduce((n,r)=>n+r.score,0)*100)/100:'';next.checked[i]=false;next.reading[i]={provider:result.provider||'gemini',text:'',status:known.length?'read':'failed',reason:row.regions.filter(r=>r.score==='').map(r=>r.reason).join(' ').slice(0,600),geminiAreas:row.regions,geminiContext:proposalContext(next,i)}}
 return validateEvaluation(next,count);
}
