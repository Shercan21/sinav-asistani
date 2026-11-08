import {ensureReadingAccess,clearReadingKeys,forgetReadingKey} from './reading-access.mjs';
import {getReadingProvider} from './reading-providers.mjs';
import {readTeacherRecord} from './cloud-record-read.mjs';
import {createSessionAccess} from './cloud-session.mjs';
import {cloudReadDeadline} from './cloud-download-cache.mjs';
import {ensureGeminiAccess,forgetGeminiKey,clearGeminiKeys} from './gemini-access.mjs';
import {createClient} from '@supabase/supabase-js';
const url='https://veoxuyxrvoytqwhtnfyh.supabase.co';
const key='sb_publishable_6zPYtmYT6E_vcarIV7gAnQ_3c3gx75y';
export const cloud = createClient(url,key,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function availableProviders() {
  const response=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Provider settings unavailable');
  const data=await response.json();return data.external||{};
}
const sessionAccess=createSessionAccess(async()=>{const {data,error}=await cloudReadDeadline(()=>cloud.auth.getSession());if(error)throw error;return data.session});
export const rememberCloudSession=session=>sessionAccess.remember(session);
let scopedConnection=null,scopedUser='';
export async function accountConnection(userId) {
  await sessionAccess.token(userId);
  if(!scopedConnection||scopedUser!==userId){scopedUser=userId;scopedConnection=createClient(url,key,{accessToken:()=>sessionAccess.token(userId)})}
  return scopedConnection;
}
let geminiAccount='';
export async function prepareGeminiAccess(){
 const {data:{session}}=await cloud.auth.getSession();const id=session?.user.id||'local';
 if(id!==geminiAccount){clearGeminiKeys();clearReadingKeys();geminiAccount=id}
 const headers=session?{Authorization:`Bearer ${session.access_token}`} : {};
 const key=await ensureGeminiAccess(id,url=>fetch(url,{headers}));
 const {data:{session:current}}=await cloud.auth.getSession();
 if((current?.user.id||'local')!==id){clearGeminiKeys();clearReadingKeys();throw new Error('Hesap değişti. Okumayı yeniden başlatın.')}
 return {key,id};
}
cloud.auth.onAuthStateChange((event,session)=>{rememberCloudSession(session);if(event==='SIGNED_OUT'){clearGeminiKeys();clearReadingKeys();geminiAccount=''}});
export async function prepareReadingAccess(provider=getReadingProvider()){
 if(provider==='gemini')return prepareGeminiAccess();
 const {data:{session}}=await cloud.auth.getSession(),id=session?.user.id||'local';
 if(id!==geminiAccount){clearGeminiKeys();clearReadingKeys();geminiAccount=id}
 const key=await ensureReadingAccess(id,provider);
 const {data:{session:current}}=await cloud.auth.getSession();
 if((current?.user.id||'local')!==id){clearReadingKeys();throw new Error('Hesap değişti. Okumayı yeniden başlatın.')}
 return {key,id};
}
export async function cloudFetch(url,options={}) {
 const {readingProvider='gemini',...requestOptions}=options;let access;if(options.method==='POST'&&['/api/ocr','/api/ocr/grade'].includes(url))access=await prepareReadingAccess(readingProvider);
 const {data:{session}} = await cloud.auth.getSession();
 const response=await fetch(url,{...requestOptions,headers:{...options.headers,...(session?{Authorization:`Bearer ${session.access_token}`} : {}),...(url==='/api/ocr/grade'?{'X-Reading-Provider':readingProvider}:{}),...(access?.key?{[readingProvider==='gemini'?'X-Gemini-Api-Key':'X-Reading-Api-Key']:access.key}:{})}});
 if(access?.key&&[400,401,403].includes(response.status)){const result=await response.clone().json().catch(()=>null);if(/anahtar|erişim/.test(result?.error||'')){if(readingProvider==='gemini')forgetGeminiKey(access.id);else forgetReadingKey(access.id,readingProvider)}}
 return response;
}

export async function readCloudRecord(userId){const token=await sessionAccess.token(userId);return cloudReadDeadline(()=>readTeacherRecord({url,key,token,signal:AbortSignal.timeout(30000)}))}

