// Normalize notation only. Never repair spelling, numbers, charges or formulas.
const supers='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻', plain='0123456789+-';
export function evidenceText(value){
 return value.normalize('NFC')
  .replace(/[₀₁₂₃₄₅₆₇₈₉]/g,c=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(c)))
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g,s=>{const p=[...s].map(c=>plain[supers.indexOf(c)]).join('');return /^[+-]$/.test(p)?p:'^'+p})
  .replace(/[−–]/g,'-').replace(/[‘’]/g,"'")
  .replace(/\^\{([+-]?\d+[+-]?)\}/g,'^$1')
  .replace(/(?<=\d),(?=\d)/g,'.')
  .replace(/(\d)\s*[×xX*·.]\s*10\s*\^\s*([+-]?\d+)/g,'$1*10^$2')
  .replace(/\s*([=+*/^(){}-])\s*/g,'$1')
  .replace(/\^([+-])(?=$|[\s.,;:)])/g,'$1')
  .replace(/\s+/g,' ').trim();
}
export function containsEvidenceQuote(text,quote){
 const source=evidenceText(text),part=evidenceText(quote);if(!part)return false;
 const word=c=>!!c&&/[\p{L}\p{N}]/u.test(c);
 for(let at=source.indexOf(part);at>=0;at=source.indexOf(part,at+1))if((!word(part[0])||!word(source[at-1]))&&(!word(part.at(-1))||!word(source[at+part.length])))return true;
 return false;
}
export function evidenceSubpart(o){return o.subpart?.trim()||o.text.match(/^\s*([a-h])\s*[).:]/i)?.[1]?.toLowerCase()||'';}
