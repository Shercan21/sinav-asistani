import {createClient} from '@supabase/supabase-js';
import {createServer} from 'node:http';
import {createHash,createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readWithGemini} from './ocr-server.mjs';
import {proposeWithGemini} from './grading-server.mjs';

const LOGIN=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sınav Asistanı · Giriş</title><style>body{font:18px system-ui;background:#f3f5f9;color:#17233c;margin:0;display:grid;min-height:100vh;place-items:center}main{background:white;padding:30px;border-radius:16px;width:min(360px,80vw)}input,button{box-sizing:border-box;width:100%;padding:14px;margin-top:14px;font:inherit}button{background:#245ad1;color:white;border:0;border-radius:8px}p{line-height:1.5}</style><main><h1>Sınav Asistanı</h1><p>Otomatik okuma sunucusunu kullanmak için belirlediğiniz giriş şifresini yazın.</p><form method="post" action="/login"><label>Giriş şifresi<input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button>Giriş yap</button></form></main></html>`;
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const digest=value=>createHash('sha256').update(value).digest();
const equal=(a,b)=>timingSafeEqual(digest(a),digest(b));
export function createApp({password,apiKey,origin,dist=resolve('dist'),secure=true,reader=readWithGemini,grader=proposeWithGemini,now=Date.now,secret=randomBytes(32),personalAuth=false}={}) {
  if(!personalAuth&&(typeof password!=='string'||password.length<12||password.length>256))throw new Error('APP_PASSWORD en az 12, en fazla 256 karakter olmalı.');
  const allowed=new URL(origin).origin;
  const authClient=personalAuth?createClient('https://veoxuyxrvoytqwhtnfyh.supabase.co','sb_publishable_6zPYtmYT6E_vcarIV7gAnQ_3c3gx75y',{auth:{persistSession:false,autoRefreshToken:false}}):null;
  const sign=text=>createHmac('sha256',secret).update(text).digest('hex');
  const csrfCookie=token=>`sa_login=${token}; HttpOnly; SameSite=Strict; Path=/login; Max-Age=900${secure?'; Secure':''}`;
  const loginTokens=new Set();
  const cookie=token=>`sa_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure?'; Secure':''}`;
  const validSession=req=>{const token=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('sa_session='))?.slice(11)||'';const [expires,nonce,signature]=token.split('.');return token.length<256&&Number(expires)>now()&&Number(expires)<=now()+43200000&&nonce?.length===32&&signature?.length===64&&equal(signature,sign(`${expires}.${nonce}`))};
  let loginAttempts=0,loginWindow=now(),active=false,lastRead=-Infinity,reads=0,readWindow=now();
  return async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
    const send=(code,body,type='application/json; charset=utf-8')=>{if(res.destroyed||res.writableEnded)return;res.writeHead(code,{'Content-Type':type});res.end(type.startsWith('application/json')?JSON.stringify(body):body)};
    const body=async limit=>{let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>limit)throw new Error('BODY_LIMIT');chunks.push(chunk)}return Buffer.concat(chunks).toString('utf8')};
    try{
      const path=new URL(req.url,'http://server').pathname;
      if(path==='/healthz'&&req.method==='GET')return send(200,{ok:true});
      if(personalAuth&&path==='/login'){res.writeHead(303,{Location:'/'});return res.end();}
      if(path==='/login'&&req.method==='GET'){
        const payload=`${now()+900000}.${randomBytes(16).toString('hex')}`,token=`${payload}.${sign(payload)}`;
        if(loginTokens.size>=1000)loginTokens.clear();loginTokens.add(token);
        res.setHeader('Set-Cookie',csrfCookie(token));
        const script=`<script>document.querySelector('form').addEventListener('submit',async function(event){event.preventDefault();const form=this,button=form.querySelector('button');button.disabled=true;let notice=document.querySelector('[role="alert"]');if(!notice){notice=document.createElement('p');notice.setAttribute('role','alert');form.after(notice)}notice.textContent='Giriş yapılıyor…';try{for(let attempt=0;attempt<2;attempt++){const fresh=await fetch('/login',{credentials:'same-origin',cache:'no-store'});if(!fresh.ok)throw new Error();const page=new DOMParser().parseFromString(await fresh.text(),'text/html');const csrf=page.querySelector('input[name="csrf"]');if(!csrf)throw new Error();form.elements.csrf.value=csrf.value;const response=await fetch('/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/x-www-form-urlencoded','X-Login-Request':'1'},body:new URLSearchParams(new FormData(form))});if(response.ok){location.replace('/');return}if(response.status===403&&attempt===0)continue;notice.textContent=await response.text();return}}catch{notice.textContent='Bağlantı kesildi. Tekrar deneyin.'}finally{button.disabled=false}});</script>`;
        return send(200,LOGIN.replace('<form method="post" action="/login">',`<form method="post" action="/login"><input type="hidden" name="csrf" value="${token}">`)+script,'text/html; charset=utf-8');
      }
      if(path==='/login'&&req.method==='POST'){
        if(!req.headers['content-type']?.startsWith('application/x-www-form-urlencoded'))return send(403,{error:'Giriş isteği doğrulanamadı.'});
        const form=new URLSearchParams(await body(2048)),token=form.get('csrf')||'',savedToken=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('sa_login='))?.slice(9)||'';
        const [expires,nonce,signature]=token.split('.');
        if(!loginTokens.delete(token)||!equal(token,savedToken)||Number(expires)<=now()||Number(expires)>now()+900000||nonce?.length!==32||signature?.length!==64||!equal(signature,sign(`${expires}.${nonce}`))){console.info('Login verification failed',JSON.stringify({formToken:Boolean(token),cookieToken:Boolean(savedToken),matched:equal(token,savedToken)}));return send(403,'Giriş sayfasının süresi doldu. Geri dönüp sayfayı yenileyin.','text/plain; charset=utf-8')}
        if(now()-loginWindow>=900000){loginAttempts=0;loginWindow=now()}
        if(loginAttempts>=10)return send(429,'Çok fazla giriş denemesi. 15 dakika sonra yeniden deneyin.','text/plain; charset=utf-8');
        loginAttempts++;
        const candidate=form.get('password')||'';
        if(!equal(candidate,password))return send(401,'Şifre yanlış. Geri dönüp tekrar deneyin.','text/plain; charset=utf-8');
        loginAttempts=0;
        const sessionToken=`${now()+43200000}.${randomBytes(16).toString('hex')}`;
        res.setHeader('Set-Cookie',cookie(`${sessionToken}.${sign(sessionToken)}`));
        if(req.headers['x-login-request']==='1')return send(200,{ok:true});
        res.writeHead(303,{Location:'/'});return res.end();
      }
      if(!personalAuth&&!validSession(req)){
        if(path.startsWith('/api/'))return send(401,{error:'Oturum kapandı. Sayfayı yenileyip giriş yapın.'});
        res.writeHead(303,{Location:'/login'});return res.end();
      }
      if(authClient&&path.startsWith('/api/ocr')){
        const token=req.headers.authorization?.match(/^Bearer (.{1,8192})$/)?.[1];
        if(!token)return send(401,{error:'Kişisel hesabınıza giriş yapın.'});
        const {data,error}=await authClient.auth.getUser(token);
        if(error||!data.user)return send(401,{error:'Kişisel oturumunuz sona erdi. Yeniden giriş yapın.'});
      }
      if(path==='/api/ocr/status'&&req.method==='GET')return send(200,{configured:Boolean(apiKey),provider:'Google Gemini',model:'gemini-2.5-flash'});
      if(['/api/ocr','/api/ocr/grade'].includes(path)&&req.method==='POST'){
        if(req.headers.origin!==allowed||!req.headers['content-type']?.startsWith('application/json'))return send(403,{error:'İstek doğrulanamadı.'});
        if(!apiKey)return send(503,{error:'Sunucuda Gemini bağlantısı ayarlanmadı.'});
        if(now()-readWindow>=3600000){reads=0;readWindow=now()}
        if(active||now()-lastRead<5000||reads>=20)return send(429,{error:'Okuma sınırına ulaşıldı veya başka okuma sürüyor. Daha sonra tekrar deneyin.'});
        active=true;lastRead=now();reads++;
        const abort=new AbortController(),closed=()=>abort.abort();res.once('close',closed);
        try{
          const input=JSON.parse(await body(15*1024*1024));
          if(input.consent!==true)return send(400,{error:'Google Gemini’ye gönderim onayı gerekli.'});
          const result=await (path==='/api/ocr/grade'?grader:reader)(input,{apiKey,signal:abort.signal});return send(200,result);
        }catch(err){return send(400,{error:err.message==='BODY_LIMIT'?'Dosya çok büyük. En fazla 10 MB seçin.':err instanceof SyntaxError?'Dosya isteği okunamadı.':['AbortError','TimeoutError'].includes(err.name)?'Okuma iptal edildi veya zaman aşımına uğradı.':err.message?.startsWith('fetch')?'Okuma servisine ulaşılamadı.':err.message||'Okuma tamamlanamadı.'})}finally{res.removeListener('close',closed);active=false}
      }
      if(path.startsWith('/api/'))return send(405,{error:'Desteklenmeyen işlem.'});
      if(!['GET','HEAD'].includes(req.method))return send(405,{error:'Desteklenmeyen işlem.'});
      const relative=decodeURIComponent(path)==='/'?'index.html':decodeURIComponent(path).replace(/^\/+/,''),file=resolve(dist,relative);
      if(!file.startsWith(resolve(dist)+sep)||relative.split(/[\\/]/).some(part=>part.startsWith('.')))return send(404,{error:'Dosya bulunamadı.'});
      try{if(!(await stat(file)).isFile())return send(404,{error:'Dosya bulunamadı.'});const data=await readFile(file);res.setHeader('Content-Type',MIME[extname(file)]||'application/octet-stream');res.statusCode=200;res.end(req.method==='HEAD'?undefined:data)}catch{return send(404,{error:'Dosya bulunamadı.'})}
    }catch{return send(400,{error:'İstek tamamlanamadı.'})}
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const origin=process.env.RENDER_EXTERNAL_URL||process.env.APP_ORIGIN;
  if(!origin)throw new Error('RENDER_EXTERNAL_URL veya APP_ORIGIN gerekli.');
  const handler=createApp({password:process.env.APP_PASSWORD,apiKey:process.env.GEMINI_API_KEY?.trim()||'',origin,personalAuth:true,secure:new URL(origin).protocol==='https:'});
  createServer(handler).listen(Number(process.env.PORT)||10000,'0.0.0.0',()=>console.log('Sınav Asistanı sunucusu hazır.'));
}
