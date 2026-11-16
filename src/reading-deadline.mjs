export async function readingDeadline(work,{signal,milliseconds=30000,message='Okuma işlemi zamanında tamamlanamadı. Yeniden deneyin.'}={}){
 let timer,onAbort;
 try{
  signal?.throwIfAborted();
  return await Promise.race([
   Promise.resolve().then(()=>{signal?.throwIfAborted();return work();}),
   new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error(message);error.name='TimeoutError';reject(error);},milliseconds);if(signal){onAbort=()=>reject(signal.reason||new DOMException('İşlem iptal edildi.','AbortError'));signal.addEventListener('abort',onAbort,{once:true});}})
  ]);
 }finally{clearTimeout(timer);if(onAbort)signal.removeEventListener('abort',onAbort);}
}
