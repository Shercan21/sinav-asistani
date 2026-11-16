import {providerErrorMessage} from './reading-provider-server.mjs';
function pause(milliseconds,signal){return new Promise((resolve,reject)=>{if(signal?.aborted)return reject(signal.reason);const done=()=>{signal?.removeEventListener('abort',abort);resolve();},timer=setTimeout(done,milliseconds),abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(signal.reason);};signal?.addEventListener('abort',abort,{once:true});});}
export async function geminiRequest(url,options,{fetcher=fetch,wait=pause}={}){
 for(let attempt=0;attempt<2;attempt++){
  options.signal?.throwIfAborted();
  const response=await fetcher(url,options);
  if(response.ok)return response;
  let payload;try{payload=await response.json();}catch{payload={};}
  if(attempt===0&&[500,502,503,504].includes(response.status)){await wait(800,options.signal);continue;}
  const error=payload?.error||{};
  throw new Error(providerErrorMessage('gemini',response.status,{...error,code:error.status||error.code}));
 }
}
