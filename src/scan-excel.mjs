import {scanTotal,scanRowIssues} from './scan-data.mjs';
export async function buildScanWorkbook(session,template,classroom){
 const included=session.rows.filter(r=>r.include);
 if(!included.length||included.some(r=>!r.reviewed||scanRowIssues(r,session.rows,classroom.students||[],template.questions).length))throw new Error('Dışa aktarılacak satırların eksiklerini tamamlayıp kontrol onaylarını verin.');
 const Excel=await import('exceljs'),Workbook=Excel.Workbook||Excel.default?.Workbook,book=new Workbook();book.creator='Sınav Asistanı';book.calcProperties.fullCalcOnLoad=true;
 const sheet=book.addWorksheet('Soru puanları',{views:[{state:'frozen',ySplit:1}],pageSetup:{orientation:'landscape',fitToPage:true,fitToWidth:1,fitToHeight:0}});
 sheet.columns=[{header:'Öğrenci no',key:'number',width:16},{header:'Ad soyad',key:'name',width:30},{header:'Sınıf/şube',key:'className',width:16},...Array.from({length:template.questions},(_,i)=>({header:`${i+1}. soru`,key:`q${i+1}`,width:12})),{header:'Toplam',key:'total',width:13},{header:'Kâğıttaki toplam',key:'paperTotal',width:20},{header:'Kontrol notu',key:'note',width:32}];
 const column=n=>{let s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
 const rows=new Map(included.map(r=>[r.studentId,r]));
 for(const student of [...(classroom.students||[])].sort((a,b)=>String(a.number).localeCompare(String(b.number),'tr',{numeric:true}))){
  const source=rows.get(student.id),row=sheet.addRow({number:String(student.number),name:String(student.name),className:classroom.name});
  row.getCell(1).numFmt='@';
  if(source){source.scores.forEach((n,i)=>{row.getCell(i+4).value=n;row.getCell(i+4).numFmt='0.00'});row.getCell(template.questions+4).value={formula:`SUM(D${row.number}:${column(template.questions+3)}${row.number})`,result:scanTotal(source.scores)};row.getCell(template.questions+4).numFmt='0.00';if(source.paperTotal!=='')row.getCell(template.questions+5).value=source.paperTotal;row.getCell(template.questions+6).value=source.totalAccepted?'Toplam farkı öğretmen tarafından kontrol edildi.':'Kontrol edildi.'}
  else row.getCell(template.questions+6).value='Henüz taranmadı.';
 }
 sheet.getRow(1).height=30;sheet.getRow(1).eachCell(c=>{c.font={bold:true,color:{argb:'FFFFFFFF'}};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF206B51'}};c.alignment={vertical:'middle',wrapText:true}});
 sheet.autoFilter={from:{row:1,column:1},to:{row:sheet.rowCount,column:sheet.columnCount}};
 sheet.eachRow((row,i)=>{if(i>1){row.height=25;row.eachCell(c=>{c.font={name:'Calibri',size:11};c.alignment={vertical:'middle',wrapText:false}})}});
 return book;
}
export async function downloadScanExcel(session,template,classroom){const book=await buildScanWorkbook(session,template,classroom),data=await book.xlsx.writeBuffer(),url=URL.createObjectURL(new Blob([data],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));const link=document.createElement('a');link.href=url;link.download=`${classroom.name}-${session.name||'puan-tarama'}`.replace(/[\\/:*?"<>|]/g,'-')+'.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
