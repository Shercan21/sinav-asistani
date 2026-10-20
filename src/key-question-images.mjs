import {fingerprintPaper} from './ocr-data.mjs';
import {createLocalReader,findPaperQuestions} from './local-reading.mjs';
import {keyQuestionAreas} from './key-question-areas.mjs';
const cache=new Map();
export async function locateKeyQuestions(file,count,onProgress){
 const id=`${await fingerprintPaper(file)}:${count}`;
 if(!cache.has(id)){
  const promise=(async()=>{const reader=await createLocalReader(onProgress);try{return keyQuestionAreas(await findPaperQuestions(file,reader,undefined,onProgress),count)}finally{await reader.close()}})();
  cache.set(id,promise);promise.catch(()=>cache.delete(id));if(cache.size>6)cache.delete(cache.keys().next().value);
 }
 return cache.get(id);
}
