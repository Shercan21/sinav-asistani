import React from 'react';
export default function StartupSplash({message='Uygulama hazırlanıyor…'}){
  return <main className="sa-splash"><img src="./icons/exam-v2-192.png" alt="" width="104" height="104"/><h1>Sınav Asistanı</h1><p role="status">{message}</p><div className="sa-splash-spinner" aria-hidden="true"/><small>Açılış uzarsa internet bağlantınızı kontrol edin.</small><a href="./">Yeniden aç</a></main>;
}
