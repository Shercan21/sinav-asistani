import {READING_PROVIDERS,validProviderKey,readingProviderName} from './reading-providers.mjs';
const keys=new Map();let pending=null;
export function forgetReadingKey(id,provider){keys.delete(id+':'+provider)}
export function clearReadingKeys(){keys.clear()}
export async function ensureReadingAccess(id,provider){
 const tag=id+':'+provider;if(keys.has(tag))return keys.get(tag);
 if(pending)throw new Error('Önce açık API anahtarı penceresini tamamlayın.');
 const meta=READING_PROVIDERS[provider];if(!meta)throw new Error('Okuma servisi geçersiz.');
 return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='gemini-key-dialog';
  dialog.innerHTML='<form><h2></h2><p>Seçilen servisin kendi API anahtarını girin. Kullanım bu API hesabının kotasına yansır.</p><p><a target="_blank" rel="noopener noreferrer">API anahtarı al ↗</a></p><label>API anahtarı<input type="password" autocomplete="off" spellcheck="false" required maxlength="510"></label><small>Anahtar yalnız bu sayfa oturumunun belleğinde tutulur; yedeğe veya buluta kaydedilmez. Okumada uygulama sunucusundan seçilen servise iletilir.</small><p role="alert"></p><div><button type="button">Vazgeç</button><button type="submit">Anahtarı kullan ve devam et</button></div></form>';
  dialog.querySelector('h2').textContent=readingProviderName(provider)+' ile oku';dialog.querySelector('a').href=meta.keyUrl;
  const input=dialog.querySelector('input');let finished=false;
  const finish=key=>{if(finished)return;finished=true;pending=null;dialog.close();dialog.remove();if(key){keys.set(tag,key);resolve(key)}else reject(new Error('Okuma iptal edildi; başka servise gönderilmedi.'))};
  pending=dialog;dialog.querySelector('[type="button"]').onclick=()=>finish('');dialog.addEventListener('cancel',e=>{e.preventDefault();finish('')});
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const key=input.value.trim();if(!validProviderKey(provider,key)){dialog.querySelector('[role="alert"]').textContent='Seçtiğiniz servisin geçerli API anahtarını girin.';return}finish(key)};
  document.body.append(dialog);dialog.showModal();input.focus();
 });
}
