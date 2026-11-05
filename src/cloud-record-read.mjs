export async function readTeacherRecord({url,key,token,fetcher=fetch,signal}){
 const response=await fetcher(`${url}/rest/v1/teacher_records?select=*`,{headers:{apikey:key,Authorization:`Bearer ${token}`,Accept:'application/json'},signal});
 if(!response.ok){const error=new Error(response.status===401?'Oturum yenilenemedi. Yeniden giriş yapın.':'Bulut kayıt listesi alınamadı.');error.code='CLOUD_HTTP_'+response.status;throw error}
 const rows=await response.json();if(!Array.isArray(rows)||rows.length>1)throw new Error('Bulut hesabı kaydı doğrulanamadı.');return rows[0]||null;
}
