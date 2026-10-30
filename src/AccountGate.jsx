import React,{useEffect,useRef,useState} from 'react';
import {cloud,availableProviders} from './cloud-client.mjs';
import {selectAccount,recordKey,accountId,paperDatabase} from './account-store.mjs';
import {getRemote,pushSnapshot,downloadSnapshot,applySnapshot,dirtyKey,revisionKey,snapshot} from './cloud-sync.mjs';
import {listPapers,toBase64} from './paper-store.mjs';
import {validateBackup} from './backup-data.mjs';
import './account.css';
import StartupSplash from './StartupSplash.jsx';
import {syncControl} from './sync-control.mjs';

const friendly=error=>error?.code==='40001'||error?.message?.includes('SYNC_CONFLICT')?
  'Başka bir cihazda kayıtlar değişti. Bu cihazdaki değişiklikleri yedekleyip buluttaki sürümü açın.':
  error?.message==='Invalid login credentials'?'E-posta veya şifre yanlış.':
  error?.message==='Email not confirmed'?'Önce e-postanıza gelen doğrulama bağlantısını açın.':
  error?.message?.includes('rate limit')?'Çok fazla deneme yapıldı. Bir süre sonra tekrar deneyin.':
  'İşlem tamamlanamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
const download=data=>{const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`sinav-asistani-guvenli-yedek-${Date.now()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)};

function Login({recovery=false}) {
  const [providers,setProviders]=useState({});
  useEffect(()=>{let live=true;availableProviders().then(data=>{if(live)setProviders(data)}).catch(()=>{});return()=>{live=false}},[]);
  const [mode,setMode]=useState(recovery?'password':'login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
  const submit=async e=>{e.preventDefault();setBusy(true);setMessage('');try{
    const redirect=window.location.origin+'/';let result;
    if(mode==='signup')result=await cloud.auth.signUp({email,password,options:{emailRedirectTo:redirect}});
    else if(mode==='reset')result=await cloud.auth.resetPasswordForEmail(email,{redirectTo:redirect});
    else if(mode==='password')result=await cloud.auth.updateUser({password});
    else result=await cloud.auth.signInWithPassword({email,password});
    if(result.error)throw result.error;
    if(mode==='login'||mode==='password'||result.data?.session)window.location.replace('/');
    else {setPassword('');setMessage(mode==='reset'?'Hesabınız varsa şifre yenileme bağlantısı e-postanıza gönderilecek.':'Doğrulama e-postanızı kontrol edin. Bağlantıyı açtıktan sonra giriş yapabilirsiniz.');}
  }catch(error){setMessage(friendly(error))}finally{setBusy(false)}};
  const social=async provider=>{setBusy(true);setMessage('');try{const {error}=await cloud.auth.signInWithOAuth({provider,options:{redirectTo:window.location.origin+'/'}});if(error)throw error;}catch(error){setMessage(friendly(error));setBusy(false)}};
  return <main className="account-screen"><section className="account-card"><h1>Sınav Asistanı</h1><h2>{mode==='signup'?'Kişisel hesap oluştur':mode==='reset'?'Şifremi unuttum':mode==='password'?'Yeni şifre belirle':'Hesabına giriş yap'}</h2><p>Aynı hesapla bilgisayar ve telefondaki kayıtlarına ulaş.</p>{(mode==='login'||mode==='signup')&&<><div className="account-social">{providers.google&&<button className="secondary" disabled={busy} onClick={()=>social('google')}>Google ile devam et</button>}{providers.apple&&<button className="secondary" disabled={busy} onClick={()=>social('apple')}>Apple ile devam et</button>}</div><p>Gmail, iCloud, Outlook veya kullandığınız başka bir e-posta adresiyle hesap açabilirsiniz.</p></>}<form onSubmit={submit}>{mode!=='password'&&<label>E-posta<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}{mode!=='reset'&&<label>{mode==='password'?'Yeni şifre':'Şifre'}<input type="password" minLength={mode==='login'?1:12} required autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}<button className="primary" disabled={busy}>{busy?'Bekleyin…':mode==='signup'?'Hesap oluştur':mode==='reset'?'Yenileme bağlantısı gönder':mode==='password'?'Yeni şifreyi kaydet':'Giriş yap'}</button></form>{mode!=='password'&&<div className="account-actions"><button disabled={busy} onClick={()=>{setMode(mode==='signup'?'login':'signup');setMessage('')}}>{mode==='signup'?'Girişe dön':'Hesap oluştur'}</button><button disabled={busy} onClick={()=>{setMode(mode==='reset'?'login':'reset');setMessage('')}}>{mode==='reset'?'Girişe dön':'Şifremi unuttum'}</button></div>}{message&&<p role="status">{message}</p>}</section></main>;
}

export default function AccountGate({children}) {
  const [session,setSession]=useState(undefined),[recovery,setRecovery]=useState(window.location.hash.includes('type=recovery'));
  useEffect(()=>{let live=true;cloud.auth.getSession().then(({data,error})=>{if(live)setSession(error?null:data.session)});const {data}=cloud.auth.onAuthStateChange((event,next)=>{if(event==='PASSWORD_RECOVERY')setRecovery(true);if(live)setSession(next)});return()=>{live=false;data.subscription.unsubscribe()}},[]);
  if(session===undefined)return <StartupSplash message="Hesabınız açılıyor…"/>;
  if(recovery)return <Login recovery/>;
  if(!session)return <Login/>;
  return <AccountWorkspace key={session.user.id} user={session.user}>{children}</AccountWorkspace>;
}

function AccountWorkspace({user,children}) {
  const [phase,setPhase]=useState('loading'),[status,setStatus]=useState('Buluta bağlanılıyor…'),[version,setVersion]=useState(0),[busy,setBusy]=useState(false),[backupDone,setBackupDone]=useState(false);
  const state=useRef({running:false,ready:false,sequence:0,stopped:false,applying:false,release:null});
  const [legacy,setLegacy]=useState(null);
  const [online,setOnline]=useState(navigator.onLine);
  useEffect(()=>{const changed=()=>setOnline(navigator.onLine);window.addEventListener('online',changed);window.addEventListener('offline',changed);return()=>{window.removeEventListener('online',changed);window.removeEventListener('offline',changed)}},[]);
  const visibleStatus=online?status:'İnternet bağlantısı yok. Eşitleme bağlantı gelince devam edecek.';
  useEffect(()=>{
    const s=state.current;selectAccount(user.id);
    const start=async()=>{try{
      if(!navigator.locks)throw new Error('LOCK_UNAVAILABLE');
      await navigator.locks.request(`sa-account-${user.id}`,{ifAvailable:true},async lock=>{
        if(!lock){setPhase('locked');return;}
        const held=new Promise(resolve=>{s.release=resolve});
        try {
          const row=await getRemote();if(s.stopped)return;
          if(row){
            const localRev=Number(localStorage.getItem(revisionKey())||0);
            if(localStorage.getItem(dirtyKey())==='1'){
              if(localRev!==row.revision){setPhase('conflict');setStatus('Cihazlar arasında farklı kayıtlar var.');}
              else {s.ready=true;setPhase('ready');setStatus('Cihazdaki değişiklikler gönderilmeyi bekliyor.');}
            }else {s.applying=true;const data=await downloadSnapshot(row,user.id);if(s.stopped)return;await applySnapshot(data,row.revision);s.applying=false;s.ready=true;setPhase('ready');setStatus(localStorage.getItem(dirtyKey())==='1'?'Taramalar buluta gönderilmeyi bekliyor.':'Bulut kayıtları güncel.');}
          } else if(localStorage.getItem(dirtyKey())==='1') {
            s.ready=true;setPhase('ready');setStatus('İlk bulut kaydı gönderilmeyi bekliyor.');
          } else {
            // Legacy records remain untouched and are never silently uploaded.
            const raw=localStorage.getItem('sa_classes');setLegacy(raw?JSON.parse(raw):[]);setStatus('Bağlantı hazır. Başlamak için aşağıdaki seçeneklerden birini seçin.');setPhase('setup');
          }
        }catch(error){setPhase('error');setStatus(friendly(error));}
        await held;
      });
    }catch(error){setPhase('error');setStatus(friendly(error));}};
    start();
    return()=>{s.stopped=true;s.ready=false;s.release?.();};
  },[user.id]);

  useEffect(()=>{
    const s=state.current;
    const changed=()=>{if(!s.ready||s.applying||s.stopped)return;s.sequence++;try{localStorage.setItem(dirtyKey(),'1');setStatus('Değişiklikler buluta gönderilmeyi bekliyor.')}catch{setPhase('error');setStatus('Cihaz kaydı yazılamadı. Önce yedeğinizi indirin.')}};
    const sync=async()=>{
      if(!s.ready||s.running||s.stopped||document.hidden||syncControl.paused)return;
      s.running=true;syncControl.running=true;const seq=s.sequence;
      try{
        const revision=Number(localStorage.getItem(revisionKey())||0),dirty=localStorage.getItem(dirtyKey())==='1';
        if(dirty){
          setStatus('Buluta kaydediliyor…');const row=await pushSnapshot(user.id,revision);
          if(s.stopped)return;
          localStorage.setItem(revisionKey(),String(row.revision));
          if(seq===s.sequence)localStorage.removeItem(dirtyKey());
          setStatus(seq===s.sequence?'Buluta kaydedildi.':'Yeni değişiklikler gönderilmeyi bekliyor.');
        }else{
          const row=await getRemote();if(s.stopped)return;
          if(row&&row.revision!==revision){
            const data=await downloadSnapshot(row,user.id);if(s.stopped)return;
            if(seq!==s.sequence||localStorage.getItem(dirtyKey())==='1')throw {code:'40001'};
            s.ready=false;s.applying=true;setPhase('loading');await applySnapshot(data,row.revision);
            s.applying=false;s.ready=true;setVersion(v=>v+1);setPhase('ready');
          }
          setStatus(localStorage.getItem(dirtyKey())==='1'?'Taramalar buluta gönderilmeyi bekliyor.':'Bulut kayıtları güncel.');
        }
      }catch(error){if(error.code==='40001'||error.message?.includes('SYNC_CONFLICT')){s.ready=false;setPhase('conflict');}else if(s.applying){s.ready=false;s.applying=false;setPhase('error');}setStatus(friendly(error));}
      finally{s.running=false;syncControl.running=false;}
    };
    window.addEventListener('sa-records-changed',changed);window.addEventListener('online',sync);window.addEventListener('focus',sync);
    const timer=setInterval(sync,5000);return()=>{clearInterval(timer);window.removeEventListener('sa-records-changed',changed);window.removeEventListener('online',sync);window.removeEventListener('focus',sync)};
  },[user.id]);

  const initialize=async useLegacy=>{setBusy(true);try{
    const s=state.current;s.applying=true;
    let data={format:'sinav-asistani',version:1,createdAt:new Date().toISOString(),classes:[],exams:[],papers:[]};
    if(useLegacy){
      const db=await new Promise((resolve,reject)=>{const req=indexedDB.open('sa_papers',1);req.onupgradeneeded=()=>req.result.createObjectStore('papers');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});
      const rows=await new Promise((resolve,reject)=>{const rows=[];const req=db.transaction('papers').objectStore('papers').openCursor();req.onsuccess=()=>{const c=req.result;if(c){rows.push([c.key,c.value]);c.continue()}else resolve(rows)};req.onerror=()=>reject(req.error)});db.close();
      data=validateBackup({...data,classes:JSON.parse(localStorage.getItem('sa_classes')||'[]'),exams:JSON.parse(localStorage.getItem('sa_exams')||'[]'),papers:await Promise.all(rows.map(async([id,f])=>({id,name:f.name,type:f.type,lastModified:f.lastModified,base64:await toBase64(f)})))});
      download(data);
    }
    await applySnapshot(data,0);localStorage.setItem(dirtyKey(),'1');
    const row=await pushSnapshot(user.id,0);localStorage.setItem(revisionKey(),String(row.revision));localStorage.removeItem(dirtyKey());
    s.applying=false;s.ready=true;setPhase('ready');setStatus('Buluta kaydedildi.');
  }catch(error){state.current.applying=false;setStatus(friendly(error));}finally{setBusy(false)}};
  const backup=async()=>{setBusy(true);try{download(await snapshot());setBackupDone(true)}catch{setStatus('Yedek hazırlanamadı. Cihaz kayıtları korundu.')}finally{setBusy(false)}};
  const signout=async()=>{if(state.current.running)return;state.current.ready=false;setBusy(true);await cloud.auth.signOut({scope:'local'});window.location.replace('/')};
  if(phase==='loading')return <StartupSplash message="Bulut kayıtlarınız açılıyor…"/>;
  return <>{phase==='ready'?<><div className="account-bar"><div className="account-summary"><strong>{user.email}</strong><span role="status">{visibleStatus}</span></div><details className="account-details"><summary>Hesabım ve eşitleme</summary><div className="account-details-body"><strong>Kişisel hesabım</strong><p>{user.email}</p><p>{visibleStatus}</p><p>Bilgisayarda ve telefonda aynı hesapla giriş yapın. Uygulama açıkken değişiklikler internet üzerinden otomatik eşitlenir. Diğer cihazda devam etmeden önce “Buluta kaydedildi” veya “Bulut kayıtları güncel” yazısını bekleyin.</p><p>Yedek dosyası almak veya eski kayıtları aktarmak için Ayarlar bölümünü kullanın.</p><button disabled={busy} onClick={signout}>Çıkış yap</button></div></details></div><div key={version}>{children}</div></>:<main className="account-screen"><section className="account-card"><h1>Kişisel çalışma alanı</h1><p>{user.email}</p>{phase==='loading'?<p>Bulut kayıtları açılıyor…</p>:phase==='locked'?<p>Bu hesap başka bir sekmede açık. Diğer sekmeyi kapatıp burayı yenileyin.</p>:phase==='setup'?<><h2>İlk eşitleme</h2><p>Bu hesapta henüz bulut kaydı yok. {legacy?.length||0} sınıf bu tarayıcının önceki kayıtlarında bulunuyor.</p><p>Aktar seçeneği sınıfları, öğrenci adlarını, sınavları, notları ve kâğıtları kendi Supabase projenizde hesabınıza özel alana gönderir. Önceki cihaz kayıtları korunur ve yedek dosyası hazırlanır.</p>{!!legacy?.length&&<button className="primary" disabled={busy} onClick={()=>initialize(true)}>Bu cihazdaki kayıtları hesabıma aktar</button>}<button className="secondary" disabled={busy} onClick={()=>initialize(false)}>Boş hesapla başla</button></>:<><p role="alert">{status}</p>{phase==='conflict'&&<><button className="primary" disabled={busy} onClick={backup}>Önce bu cihazın yedeğini indir</button><button className="secondary" disabled={busy||!backupDone} onClick={()=>{localStorage.removeItem(dirtyKey());window.location.reload()}}>Yedeği aldım, buluttaki sürümü aç</button></>}<button className="secondary" disabled={busy} onClick={()=>window.location.reload()}>Tekrar dene</button></>}{phase==='setup'&&<p role="status">{busy?'Kayıtlar hazırlanıyor…':status}</p>}<button className="secondary" disabled={busy} onClick={signout}>Çıkış yap</button></section></main>}</>;
}
