export function orderedJobGrades(data) {
  return [...(data?.jobGrades || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function employeeJobGrade(employee, data) {
  return orderedJobGrades(data).find((grade) => grade.id === employee?.profile?.gradeId) || null;
}

export function jobGradeLabel(grade) {
  return grade ? [grade.gradeNumber, grade.title].filter(Boolean).join(" · ") : "";
}