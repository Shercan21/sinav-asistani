export function createSessionAccess(refresh,now=()=>Date.now()){
 let current=null;
 return {remember:session=>{current=session||null},token:async userId=>{
  if(!userId||current?.user?.id!==userId)throw new Error('Account changed');
  if(!current.access_token||!Number.isFinite(current.expires_at)||current.expires_at*1000<=now()+30000){const next=await refresh();if(current?.user?.id!==userId||next?.user?.id!==userId)throw new Error('Account changed');current=next}
  if(!current?.access_token||current.expires_at*1000<=now())throw new Error('Oturum yenilenemedi. Yeniden giriş yapın.');return current.access_token;
 }};
}
