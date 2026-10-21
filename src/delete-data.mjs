export function planDeletion(classes,exams,target,paperRows=[]) {
  const classroom=classes.find(c=>c.id===target.classId);
  if(!classroom)throw new Error('Sınıf bulunamadı.');
  const student=target.studentId?(classroom.students||[]).find(s=>s.id===target.studentId):null;
  if(target.studentId&&!student)throw new Error('Öğrenci bulunamadı.');
  const linked=exams.filter(e=>e.className===classroom.name),linkedIds=new Set(linked.map(e=>e.id));
  const papers=paperRows.filter(([id])=>{const [examId,studentId]=String(id).split(':');return linkedIds.has(examId)&&(!student||studentId===student.id)});
  const resultCount=linked.reduce((sum,e)=>sum+(student?(e.results?.[student.id]?1:0):Object.keys(e.results||{}).length),0);
  const omit=(object,id)=>Object.fromEntries(Object.entries(object||{}).filter(([key])=>key!==id));
  const nextClasses=student?classes.map(c=>c.id===classroom.id?{...c,students:c.students.filter(s=>s.id!==student.id),count:Math.max(c.students.length-1,Number(c.count)-1)}:c):classes.filter(c=>c.id!==classroom.id);
  const nextExams=student?exams.map(e=>linkedIds.has(e.id)?{...e,...Object.fromEntries(['results','readings','paperMarks','evaluations'].filter(field=>e[field]!==undefined).map(field=>[field,omit(e[field],student.id)]))}:e):exams.filter(e=>!linkedIds.has(e.id));
  return {classes:nextClasses,exams:nextExams,paperIds:papers.map(([id])=>id),label:student?`${student.number} · ${student.name}`:classroom.name,studentCount:student?1:(classroom.students||[]).length,examCount:student?0:linked.length,resultCount,paperCount:papers.length};
}
