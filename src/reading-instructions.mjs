export const INSTRUCTION_RULES={
 shared:{label:'Soru metnini ve basılı örnekleri öğrenci cevabından ayır',text:'Basılı örnekleri ve bütün kâğıtlarda ortak olan el yazılı soru görsellerini öğrenci cevabı olarak puanlama.'},
 overflow:{label:'Kenara ve alta taşan cevap devamlarını kontrol et',text:'Tam sayfayı yer bulmak için incele. Aynı soruya açık etiket veya okla bağlanan devamları dikkate al; bağlı cevap alanı yetersizse belirt. Başka sorudan cevap taşıma.'},
 units:{label:'Birim, üs, alt indis ve iyon yüklerini dikkatle kontrol et',text:'Birimleri, katsayıları, ondalık virgülü, üsleri, alt indisleri ve iyon yüklerini koru; öğrencinin hatasını zihninde düzelterek doğru sayma. Farklı birim ve fiziksel büyüklükleri aynı kabul etme.'},
 meaning:{label:'Aynı doğru anlamdaki farklı ifadeleri kabul et',text:'Cevap Açıklaması değerlendirme koşullarını açıklar; Örnek Öğrenci Cevabı tek geçerli sözcük dizisi değildir. Aynı doğru anlamı taşıyan ifadeleri kaydedilmiş ölçütlerle değerlendir; yalnız sözcük geçmesi tam puana yetmez.'},
 subparts:{label:'a, b, c gibi alt maddeleri ayrı değerlendir',text:'Her alt maddeyi kendi etiketiyle bağımsız eşleştir. Ara işlemi veya başka alt maddenin sonucunu cevap yerine taşıma; puanı kayıtlı ölçütten al.'},
 model:{label:'Çizim / molekül / model cevabını incele',text:'Çizimde tür, adet ve gruplamayı incele. Öğrencinin açıklamalarını, etiketlerini, boyut veya tarama farklarını dikkate al; örnekle aynı renk ve konumu zorunlu sayma. Eşleştirme belirsizse tahmin etme.'},
 method:{label:'Tanımlı rubriğe göre işlem basamaklarını değerlendir',text:'İşlem basamağına yalnız öğretmen ayrı puan tanımlamışsa puan ver. Doğru yöntem, ara sonuç ve nihai sonucu ayır; hata taşıma veya kısmi puan kuralı uydurma.'},
 uncertain:{label:'Okunamayanı yanlış sayma; nedenini belirt',text:'Okunamayan veya konumu bulunamayan cevabı otomatik sıfır sayma. Belirsiz puanı boş bırak ve kısa neden yaz; açık yanlış ve açık boş yanıtı ayrı değerlendir.'}
};
const defaults=['shared','overflow','units','meaning','uncertain'];
export function emptyInstructions(count){return {version:1,rules:[...defaults],examNote:'',questions:Array.from({length:count},()=>({rules:[],note:''}))}}
export function validateInstructions(value,count){
 if(value===undefined)return;
 const rules=v=>Array.isArray(v)&&v.length<=Object.keys(INSTRUCTION_RULES).length&&new Set(v).size===v.length&&v.every(x=>Object.hasOwn(INSTRUCTION_RULES,x));
 if(!value||value.version!==1||!rules(value.rules)||typeof value.examNote!=='string'||value.examNote.length>4000||!Array.isArray(value.questions)||value.questions.length!==count||value.questions.some(q=>!q||!rules(q.rules)||typeof q.note!=='string'||q.note.length>2000))throw new Error('Okuma yönergelerini kontrol edin. Sınav açıklaması en fazla 4000, soru açıklaması en fazla 2000 karakter olabilir.');
 return value;
}
export function copyInstructions(value,count){if(!value)return emptyInstructions(count);validateInstructions(value,value.questions.length);return {...structuredClone(value),questions:Array.from({length:count},(_,i)=>value.questions.length===count?structuredClone(value.questions[i]):{rules:[],note:''})}}
export function instructionContext(value,count,targets){
 validateInstructions(value,count);const v=value||emptyInstructions(count),expand=ids=>ids.map(id=>({id,rule:INSTRUCTION_RULES[id].text}));
 return {generalRules:expand(v.rules),examNote:v.examNote,questions:targets.map(q=>({question:q,rules:expand(v.questions[q-1].rules),note:v.questions[q-1].note}))};
}
