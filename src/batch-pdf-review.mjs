export function remainingPdfStudents(groups,assignments,students,groupId){
 const used=new Set(groups.filter(g=>g.id!==groupId&&assignments[g.id]?.include!==false).map(g=>assignments[g.id]?.studentId).filter(Boolean)),current=assignments[groupId]?.studentId;
 return students.filter(s=>s.id===current||!used.has(s.id));
}
export function nextUnmatchedPdfGroup(groups,assignments,currentId){
 const at=groups.findIndex(g=>g.id===currentId),ordered=[...groups.slice(at+1),...groups.slice(0,Math.max(0,at))];
 return ordered.find(g=>assignments[g.id]?.include!==false&&!assignments[g.id]?.studentId)||null;
}
