export const READING_PROVIDERS={gemini:{name:'Gemini',model:'gemini-2.5-flash',keyUrl:'https://aistudio.google.com/api-keys'},openai:{name:'ChatGPT (OpenAI API)',model:'gpt-5.4',keyUrl:'https://platform.openai.com/api-keys'},claude:{name:'Claude',model:'claude-sonnet-4-6',keyUrl:'https://console.anthropic.com/settings/keys'}};
export const validReadingProvider=p=>Object.hasOwn(READING_PROVIDERS,p);
export const readingProviderName=p=>READING_PROVIDERS[p]?.name||'Yapay zekâ';
let selected='gemini';const listeners=new Set();
export const getReadingProvider=()=>selected;
export function selectReadingProvider(p){if(!validReadingProvider(p))throw new Error('Okuma servisi geçersiz.');selected=p;for(const f of listeners)f()}
export function subscribeReadingProvider(f){listeners.add(f);return()=>listeners.delete(f)}
export function validProviderKey(provider,key){return typeof key==='string'&&!(provider==='openai'&&key.startsWith('sk-ant-'))&&(provider==='gemini'?/^AIza[A-Za-z0-9_-]{20,196}$/:provider==='openai'?/^sk-[A-Za-z0-9_-]{20,500}$/:provider==='claude'?/^sk-ant-[A-Za-z0-9_-]{20,500}$/:/$a/).test(key)}
