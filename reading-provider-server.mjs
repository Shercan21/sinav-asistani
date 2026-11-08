import {READING_PROVIDERS,validReadingProvider,validProviderKey,readingProviderName} from './src/reading-providers.mjs';
export function readingRequestAccess(headers,geminiKey=''){
 const provider=headers['x-reading-provider']||'gemini';
 if(!validReadingProvider(provider))throw new Error('Okuma servisi geçersiz.');
 const key=provider==='gemini'?headers['x-gemini-api-key']:headers['x-reading-api-key'];
 if(key!==undefined&&!validProviderKey(provider,key))throw new Error('Geçerli bir '+readingProviderName(provider)+' API anahtarı girin.');
 return {provider,apiKey:key||(provider==='gemini'?geminiKey:'')};
}
export async function alternativeVisualRequest(provider,geminiOptions,fetcher){
 if(!['openai','claude'].includes(provider))throw new Error('Okuma servisi geçersiz.');
 const source=JSON.parse(geminiOptions.body),model=READING_PROVIDERS[provider].model;
 const system=source.systemInstruction.parts.map(p=>p.text).join('\n')+'\nYalnız geçerli JSON nesnesi döndür; Markdown kullanma. Çıktı şeması: '+JSON.stringify(source.generationConfig.responseSchema);
 const parts=source.contents[0].parts;
 const key=geminiOptions.headers['x-goog-api-key'];
 const content=parts.map((p,i)=>{
  if(p.text!==undefined)return {type:provider==='openai'?'input_text':'text',text:p.text};
  const image=p.inlineData,pdf=image.mimeType==='application/pdf';
  if(provider==='openai')return pdf?{type:'input_file',filename:`belge-${i}.pdf`,file_data:`data:${image.mimeType};base64,${image.data}`}:{type:'input_image',image_url:`data:${image.mimeType};base64,${image.data}`,detail:'high'};
  return {type:pdf?'document':'image',source:{type:'base64',media_type:image.mimeType,data:image.data}};
 });
 const body=provider==='openai'?{model,store:false,instructions:system,max_output_tokens:24000,text:{format:{type:'json_object'}},input:[{role:'user',content}]}:{model,max_tokens:24000,system,messages:[{role:'user',content}]};
 const response=await fetcher(provider==='openai'?'https://api.openai.com/v1/responses':'https://api.anthropic.com/v1/messages',{method:'POST',signal:geminiOptions.signal,headers:{'Content-Type':'application/json',...(provider==='openai'?{Authorization:`Bearer ${key}`}:{'x-api-key':key,'anthropic-version':'2023-06-01'})},body:JSON.stringify(body)});
 const name=readingProviderName(provider);
 if(!response.ok)throw new Error(response.status===429?`${name} kotası veya hız sınırı doldu. Servis değiştirerek kalanlarla devam edebilirsiniz.`:[400,401,403,404].includes(response.status)?`${name} API anahtarı, model veya dosya erişimi doğrulanamadı.`:`${name} servisi yanıt veremiyor.`);
 const data=await response.json();
 if(provider==='openai'?data.status!=='completed':data.stop_reason!=='end_turn')throw new Error(`${name} okuması tamamlanmadı; puan tahmin edilmedi.`);
 const text=provider==='openai'?(data.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join(''):(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
 return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]})};
}
