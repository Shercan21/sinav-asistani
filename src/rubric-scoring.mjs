import {resetQuestionForReading,proposalContext} from './local-key-compare.mjs';
import {validateEvaluation} from './visual-assessment.mjs';
export function applyCriterionScores(draft,index,rows){
 if(!rows.length||rows.some(r=>r.score===''||!Number.isFinite(r.score)||r.score<0||r.score>r.max))throw new Error('Bütün ölçüt puanlarını tamamlayın.');
 const next=resetQuestionForReading(draft,index),total=Math.round(rows.reduce((n,r)=>n+r.score,0)*100)/100;next.manualScores[index]=total;next.reading[index]={provider:draft.reading[index]?.provider||'gemini',text:'',status:'read',reason:'',geminiAreas:structuredClone(rows),geminiContext:proposalContext(next,index)};return validateEvaluation(next,next.manualScores.length);
}
