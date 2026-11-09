// Existing rubric/provider tests mock extraction separately from grading.
export function withStudentEvidence(fetcher){
 let observations=[];
 return async(url,options)=>{
  const body=JSON.parse(options.body),parts=body.contents?.[0]?.parts||body.input?.[0]?.content||body.messages?.[0]?.content||[];
  const stage=parts.find(p=>p.text?.includes('"stage":"student-evidence"'));
  if(stage){
   const targets=JSON.parse(stage.text).targets;
   observations=targets.map(question=>({id:`e-${question}`,question,kind:'writing',text:'Test öğrenci cevabı.',page:1,x:.1,y:.1,width:.5,height:.2}));
   const text=JSON.stringify({observations});
   return {ok:true,json:async()=>url.includes('openai.com')?{status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]}:url.includes('anthropic.com')?{stop_reason:'end_turn',content:[{type:'text',text}]}:{candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]}};
  }
  const response=await fetcher(url,options);if(!response.ok)return response;
  return {...response,json:async()=>{
   const result=await response.json();
   const blocks=result.candidates?.[0]?.content?.parts||result.output?.[0]?.content||result.content||[];
   for(const b of blocks)if(b.text){const data=JSON.parse(b.text);for(const a of data.answers||[])for(const r of a.regions||[]){r.evidenceId=`e-${a.question}`;r.studentQuote='Test öğrenci cevabı.';}b.text=JSON.stringify(data);}
   return result;
  }};
 };
}
