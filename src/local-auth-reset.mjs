// Discard only this project's login session. Classes, papers, grades and backups are untouched.
export function clearProjectLogin(storage,projectRef){
 if(!/^[a-z0-9]{20}$/.test(projectRef))throw new Error('Invalid project');
 const base=`sb-${projectRef}-auth-token`;
 for(const key of [base,base+'-user',base+'-code-verifier'])storage.removeItem(key);
}
