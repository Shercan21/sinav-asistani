let account = '';
export const selectAccount = id => { account = id || ''; };
export const accountId = () => account;
export const recordKey = key => account ? `${key}:${account}` : key;
export const paperDatabase = () => account ? `sa_papers_${account}` : 'sa_papers';
export const recordsChanged = () => window.dispatchEvent(new Event('sa-records-changed'));
