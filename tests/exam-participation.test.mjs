import {participationButtonSvg} from '../src/participation-buttons.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {participationRows,participationExportIssues,validateParticipation} from '../src/exam-participation.mjs';
import {buildEokulWorkbook} from '../src/eokul-excel.mjs';
import {validateBackup} from '../src/backup-data.mjs';
import {planDeletion} from '../src/delete-data.mjs';
const students=[{id:'a',number:'0012',name:'Örnek Öğrenci'},{id:'b',number:'13',name:'Diğer Öğrenci'}],classroom={id:'c',name:'10-C',count:2,students};
const fixture=()=>({id:'e',name:'Yazılı',subject:'Kimya',className:'10-C',type:'Klasik',questions:2,key:[{max:40},{max:60}],results:{a:[17.5,60]}});
test('paper presence sets defaults for this exam only; teacher overrides win and can return to automatic without changing saved grades',()=>{
 const exam=fixture(),papers=new Set(['e:a','other:b','e:__answer_key__']);let rows=participationRows(exam,students,papers);assert.deepEqual(rows.map(r=>r.status),['Girdi','Girmedi']);assert.deepEqual(rows.map(r=>r.total),[77.5,0]);
 const before=structuredClone(exam.results);exam.participation={a:'Muaf',b:'Kopya'};rows=participationRows(exam,students,papers);assert.deepEqual(rows[0].scores,[null,null]);assert.deepEqual(rows[1].scores,[0,0]);assert.equal(rows[0].automatic,false);assert.deepEqual(exam.results,before);
 delete exam.participation.a;assert.equal(participationRows(exam,students,papers)[0].status,'Girdi');
 assert.equal(participationRows(exam,students,new Set())[0].status,'Girmedi');
});
test('missing Girdi scores never become zero or exportable; exact saved test choices convert to question points',()=>{
 const exam=fixture(),rows=participationRows(exam,students,new Set(['e:a','e:b']));assert.equal(rows[1].total,null);assert.ok(participationExportIssues(exam,rows).some(s=>s.startsWith('13:')));
 const testExam={...exam,type:'Test',key:[{max:40,answer:'A'},{max:60,answer:'B'}],results:{a:['A','C']}};
 assert.deepEqual(participationRows(testExam,students,new Set(['e:a']))[0].scores,[40,0]);
});
test('participation survives backup roundtrip, rejects unrelated students and invalid statuses; student deletion removes only that override',()=>{
 const exam={...fixture(),participation:{a:'Muaf',b:'Kopya'}},data={format:'sinav-asistani',version:1,classes:[classroom],exams:[exam],papers:[]};
 assert.deepEqual(validateBackup(JSON.parse(JSON.stringify(data))).exams[0].participation,exam.participation);
 assert.throws(()=>validateParticipation({unknown:'Girdi'},students));assert.throws(()=>validateParticipation({a:'Other'},students));
 const deleted=planDeletion([classroom],[exam],{classId:'c',studentId:'a'});assert.deepEqual(deleted.exams[0].participation,{b:'Kopya'});assert.deepEqual(exam.results.a,[17.5,60]);
});
test('Excel uses the e-Okul column order, text numbers, saved decimals, zero for absent, blank for exempt, and cached SUM totals',async()=>{
 const exam=fixture(),rows=participationRows(exam,students,new Set(['e:a'])),book=await buildEokulWorkbook(exam,rows),s=book.getWorksheet(1);
 assert.deepEqual(s.getRow(1).values.slice(1),['Okul No','Öğrenci Adı Soyadı','Katılım Durumu','1. (40)','2. (60)','Toplam (100)']);
 assert.equal(s.getCell('A2').value,'0012');assert.equal(s.getCell('D2').value,17.5);assert.deepEqual(s.getCell('F2').value,{formula:'SUM(D2:E2)',result:77.5});assert.ok((await book.xlsx.writeBuffer()).byteLength>1000);assert.equal(s.getCell('C3').value,'Girmedi');assert.equal(s.getCell('D3').value,0);
 const exempt=await buildEokulWorkbook({...exam,participation:{a:'Muaf'}},participationRows({...exam,participation:{a:'Muaf'}},students,new Set(['e:a'])));assert.equal(exempt.getWorksheet(1).getCell('D2').value,null);assert.equal(exempt.getWorksheet(1).getCell('F2').value,null);
 await assert.rejects(buildEokulWorkbook(exam,participationRows(exam,students,new Set(['e:a','e:b']))),/henüz kaydedilmemiş/);
});

test('export embeds four side-by-side status buttons for every student and keeps the selected status as cell data',async()=>{
 const exam=fixture(),rows=participationRows(exam,students,new Set(['e:a'])),requested=[];
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZQAAAABJRU5ErkJggg==';
 const book=await buildEokulWorkbook(exam,rows,{renderButtons:async status=>{requested.push(status);const svg=participationButtonSvg(status);for(const label of ['Girdi','Girmedi','Muaf','Kopya'])assert.ok(svg.includes('>'+label+'</text>'));assert.equal((svg.match(/font-weight="700"/g)||[]).length,1);return png;}});
 assert.deepEqual(requested,['Girdi','Girmedi']);assert.equal(book.getWorksheet(1).getImages().length,2);assert.equal(book.getWorksheet(1).getCell('C2').value,'Girdi');assert.ok((await book.xlsx.writeBuffer()).byteLength>1000);
});
