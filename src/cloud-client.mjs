import {createClient} from '@supabase/supabase-js';
const url='https://veoxuyxrvoytqwhtnfyh.supabase.co';
const key='sb_publishable_6zPYtmYT6E_vcarIV7gAnQ_3c3gx75y';
export const cloud = createClient(url,key,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export async function accountConnection(userId) {
  const {data:{session}}=await cloud.auth.getSession();
  if(session?.user.id!==userId)throw new Error('Account changed');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
    global:{headers:{Authorization:`Bearer ${session.access_token}`}}});
}
export async function cloudFetch(url,options={}) {
  const {data:{session}} = await cloud.auth.getSession();
  return fetch(url,{...options,headers:{...options.headers,...(session?{Authorization:`Bearer ${session.access_token}`}:{})}});
}
