export async function verifiedCachedPaper(paper,userId,readLocal,digest){
 if(typeof paper.path!=='string'||!new RegExp(`^${userId}/[a-f0-9]{64}$`).test(paper.path))throw new Error('Kâğıt yolu doğrulanamadı.');
 const local=await readLocal(paper.id);if(!local||local.type!==paper.type||local.size>15728640)return null;
 return paper.path.endsWith('/'+await digest(local))?local:null;
}
export async function cloudReadDeadline(work,milliseconds=45000){
 let timer;try{return await Promise.race([work(),new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error('Bulut yanıtı zamanında gelmedi. Tekrar deneyin.');error.code='CLOUD_TIMEOUT';reject(error)},milliseconds)})])}finally{clearTimeout(timer)}
}
