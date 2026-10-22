const keys=new Map();
let pending=null;
export function clearGeminiKeys(){keys.clear()}
export async function ensureGeminiAccess(userId,request){
 if(keys.has(userId))return keys.get(userId);
 const response=await request('/api/ocr/status');const status=await response.json();
 if(!response.ok)throw new Error(status.error||'Gemini bağlantısı kontrol edilemedi.');
 if(status.configured)return '';
 if(pending)throw new Error('Önce açık Gemini anahtarı penceresini tamamlayın.');
 return new Promise((resolve,reject)=>{
  const dialog=document.createElement('dialog');dialog.className='gemini-key-dialog';
  dialog.innerHTML=`<form><h2>Gemini ile oku</h2><p>Okuma için kendi Gemini API anahtarınızı girin. Kullanım Google hesabınızın kotasından düşer.</p><p><a href="https://aistudio.google.com/api-keys" target="_blank" rel="noopener noreferrer">Anahtarım yok · Google AI Studio’dan al ↗</a></p><label>Gemini API anahtarı<input type="password" autocomplete="off" spellcheck="false" required maxlength="200" placeholder="Anahtarı buraya yapıştırın"></label><small>Anahtar yalnız bu sayfa oturumunun belleğinde tutulur; yedeğe ve bulut kayıtlarına eklenmez. Okuma sırasında uygulama sunucusu üzerinden Google’a iletilir.</small><p role="alert"></p><div><button type="button">Vazgeç</button><button type="submit">Anahtarı kullan ve devam et</button></div></form>`;
  const input=dialog.querySelector('input'),notice=dialog.querySelector('[role="alert"]');
  const finish=(key)=>{pending=null;dialog.close();dialog.remove();if(key){keys.set(userId,key);resolve(key)}else reject(new Error('Okuma iptal edildi; puanlar değiştirilmedi.'))};
  pending=dialog;dialog.querySelector('button[type="button"]').onclick=()=>finish('');dialog.addEventListener('cancel',e=>{e.preventDefault();finish('')});
  dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const key=input.value.trim();if(!/^AIza[A-Za-z0-9_-]{20,196}$/.test(key)){notice.textContent='Google AI Studio’dan aldığınız geçerli API anahtarını yapıştırın.';return}finish(key)};
  document.body.append(dialog);dialog.showModal();input.focus();
 });
}
export function forgetGeminiKey(userId){keys.delete(userId)}
