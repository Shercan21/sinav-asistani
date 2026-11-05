export async function canOpenCachedWorkspace(userId,{activeAccount,storage,snapshot}){
 if(!userId||activeAccount()!==userId)return false;
 const revision=Number(storage.getItem(`sa_cloud_revision:${userId}`));
 if(!Number.isInteger(revision)||revision<1||storage.getItem(`sa_classes:${userId}`)===null||storage.getItem(`sa_exams:${userId}`)===null)return false;
 try{await snapshot();return activeAccount()===userId}catch{return false}
}
export function isConnectionFailure(error){return error?.code==='CLOUD_TIMEOUT'||/^CLOUD_HTTP_5\d\d$/.test(String(error?.code))||['TimeoutError','AbortError'].includes(error?.name)||/Failed to fetch|fetch failed|NetworkError|network request|Load failed|network error/i.test(String(error?.message))}
