import {READING_PROVIDERS,validReadingProvider,validProviderKey,readingProviderName} from './src/reading-providers.mjs';
export function readingRequestAccess(headers,geminiKey=''){
 const provider=headers['x-reading-provider']||'gemini';
 if(!validReadingProvider(provider))throw new Error('Okuma servisi geçersiz.');
 const key=provider==='gemini'?headers['x-gemini-api-key']:headers['x-reading-api-key'];
 if(key!==undefined&&!validProviderKey(provider,key))throw new Error('Geçerli bir '+readingProviderName(provider)+' API anahtarı girin.');
 return {provider,apiKey:key||(provider==='gemini'?geminiKey:'')};
}
export function providerErrorMessage(provider,status,error={}){
 const name=readingProviderName(provider),safe=v=>typeof v==='string'&&!/^(sk-|AIza)/.test(v)&&/^[a-zA-Z0-9_.\[\]-]{1,80}$/.test(v)?v:'',code=safe(error.code)||safe(error.type),param=safe(error.param);
 const tag=` (HTTP ${status}${code?'; '+code:''}${param?'; '+param:''})`;
 const message=typeof error.message==='string'?error.message.toLowerCase():'';
 if(status===401||code==='invalid_api_key'||code==='authentication_error')return `${name} API anahtarı kabul edilmedi. Anahtarı yeniden girin.`+tag;
 if(code==='insufficient_quota'||code==='billing_hard_limit_reached'||/credit balance|insufficient credits|billing/.test(message))return `${name} API bakiyesi veya harcama limiti yetersiz. API hesabınızın kullanım ve ödeme bölümünü kontrol edin.`+tag;
 if(status===429)return `${name} kotası veya hız sınırı doldu. Servis değiştirerek kalanlarla devam edebilirsiniz.`+tag;
 if(code==='model_not_found'||param==='model'||status===404)return `${name}: seçili ${READING_PROVIDERS[provider].model} modeli bu API hesabında kullanılamıyor.`+tag;
 if(status===403)return `${name} API projesinin bu işleme yetkisi yok. Anahtar izinlerini ve hesap erişimini kontrol edin.`+tag;
 if(/file|pdf|image|base64|document/.test(code+' '+param+' '+message))return `${name} gönderilen PDF veya görüntüyü kabul etmedi. Dosya biçimi, boyutu veya içeriği kontrol edilmeli.`+tag;
 if(status===400)return `${name} okuma isteğinin biçimini veya ayarını kabul etmedi.`+tag;
 return `${name} servisi yanıt veremiyor.`+tag;
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
 if(provider==='openai')content.push({type:'input_text',text:'Yanıtı yalnız geçerli JSON nesnesi olarak ver.'});
 const body=provider==='openai'?{model,store:false,instructions:system,max_output_tokens:24000,text:{format:{type:'json_object'}},input:[{role:'user',content}]}:{model,max_tokens:24000,system,messages:[{role:'user',content}]};
 const response=await fetcher(provider==='openai'?'https://api.openai.com/v1/responses':'https://api.anthropic.com/v1/messages',{method:'POST',signal:geminiOptions.signal,headers:{'Content-Type':'application/json',...(provider==='openai'?{Authorization:`Bearer ${key}`}:{'x-api-key':key,'anthropic-version':'2023-06-01'})},body:JSON.stringify(body)});
 const name=readingProviderName(provider);
 if(!response.ok){let failure;try{failure=await response.json()}catch{failure={}}throw new Error(providerErrorMessage(provider,response.status,failure?.error||{}))}
 const data=await response.json();
 if(provider==='openai'?data.status!=='completed':data.stop_reason!=='end_turn')throw new Error(`${name} okuması tamamlanmadı; puan tahmin edilmedi.`);
 const text=provider==='openai'?(data.output||[]).filter(x=>x.type==='message').flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join(''):(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('');
 return {ok:true,json:async()=>({candidates:[{finishReason:'STOP',content:{parts:[{text}]}}]})};
}
