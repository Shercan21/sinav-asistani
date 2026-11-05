// A criterion rectangle belongs to the answer key, never to the student's search space.
export function visualSearchRubric(rubric){
 return rubric.map(q=>({question:q.question,answerAreaTemplates:q.answerAreas||[],criteria:q.regions.map((r,i)=>{
  const ids=r.answerAreaIds||[],templates=(q.answerAreas||[]).filter(a=>ids.includes(a.id));
  const hints=(q.studentSearchAreas||[]).filter(a=>!a.answerAreaId||ids.includes(a.answerAreaId));
  const {page,x,y,width,height}=r;
  return{region:i+1,label:r.label||`${i+1}. ölçüt`,max:r.max,acceptableAlternatives:r.alternatives||[],reference:{document:'answer-key',area:{page,x,y,width,height}},search:{document:'student',scope:templates.length?'entire-linked-answer-areas':'entire-question-answer',answerAreaIds:ids,answerAreaTemplates:templates,locationHints:hints,requireSamePosition:false}};
 })}));
}
