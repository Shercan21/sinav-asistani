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
export async function accountConnection(userId) {
  const {data:{session}}=await cloud.auth.getSession();
  if(session?.user.id!==userId)throw new Error('Account changed');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{Authorization:`Bearer ${session.access_token}`}}});
}
let geminiAccount='';
export async function prepareGeminiAccess(){
 const {data:{session}}=await cloud.auth.getSession();const id=session?.user.id||'local';
 if(id!==geminiAccount){clearGeminiKeys();geminiAccount=id}
 const headers=session?{Authorization:`Bearer ${session.access_token}`} : {};
 const key=await ensureGeminiAccess(id,url=>fetch(url,{headers}));
 const {data:{session:current}}=await cloud.auth.getSession();
 if((current?.user.id||'local')!==id){clearGeminiKeys();throw new Error('Hesap değişti. Okumayı yeniden başlatın.')}
 return {key,id};
}
cloud.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){clearGeminiKeys();geminiAccount=''}});
export async function cloudFetch(url,options={}) {
 let access;if(options.method==='POST'&&['/api/ocr','/api/ocr/grade'].includes(url))access=await prepareGeminiAccess();
 const {data:{session}} = await cloud.auth.getSession();
 const response=await fetch(url,{...options,headers:{...options.headers,...(session?{Authorization:`Bearer ${session.access_token}`} : {}),...(access?.key?{'X-Gemini-Api-Key':access.key}:{})}});
 if(access?.key&&response.status===400){const result=await response.clone().json().catch(()=>null);if(/anahtar|erişim/.test(result?.error||''))forgetGeminiKey(access.id)}
 return response;
}
