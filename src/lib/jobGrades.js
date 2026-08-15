import { updateCompany } from "@/lib/store";

export function orderedJobGrades(data) {
  return [...(data?.jobGrades || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function gradesForTrack(data, trackId) {
  const grades = orderedJobGrades(data);
  if (!trackId) return grades;
  return grades.filter((grade) => grade.trackId === trackId);
}

export function addJobGrade(companyId, gradeNumber, title, trackId) {
  const number = String(gradeNumber || "").trim();
  const name = String(title || "").trim();
  if (!companyId || !number || !name || !trackId) return null;
  let created = null;
  updateCompany(companyId, (data) => {
    data.jobGrades = data.jobGrades || [];
    const siblings = data.jobGrades.filter((grade) => grade.trackId === trackId);
    created = {
      id: `grade_${Date.now().toString(36)}`,
      gradeNumber: number,
      title: name,
      trackId,
      order: siblings.length,
    };
    data.jobGrades.push(created);
  });
  return created;
}

export function saveJobGrade(companyId, { id, gradeNumber, title, trackId }) {
  const number = String(gradeNumber ?? "").trim();
  const name = String(title ?? "").trim();
  if (!companyId || !id || !number || !name) return false;
  let ok = false;
  updateCompany(companyId, (data) => {
    const grade = (data.jobGrades || []).find((item) => item.id === id);
    if (!grade) return;
    grade.gradeNumber = number;
    grade.title = name;
    if (trackId) grade.trackId = trackId;
    ok = true;
  });
  return ok;
}

export function setJobGradeTrack(companyId, id, trackId) {
  if (!companyId || !id || !trackId) return false;
  let ok = false;
  updateCompany(companyId, (data) => {
    const grade = (data.jobGrades || []).find((item) => item.id === id);
    if (!grade) return;
    grade.trackId = trackId;
    ok = true;
  });
  return ok;
}

export function deleteJobGrade(companyId, id) {
  if (!companyId || !id) return;
  updateCompany(companyId, (data) => {
    data.jobGrades = (data.jobGrades || []).filter((grade) => grade.id !== id);
    data.jobGrades.forEach((grade, order) => { grade.order = order; });
    (data.employees || []).forEach((employee) => {
      if (employee.profile?.gradeId === id) employee.profile.gradeId = null;
    });
  });
}

export function moveJobGrade(companyId, id, direction) {
  if (!companyId || !id) return;
  updateCompany(companyId, (data) => {
    const current = (data.jobGrades || []).find((grade) => grade.id === id);
    if (!current) return;
    const list = (data.jobGrades || [])
      .filter((grade) => (grade.trackId || "") === (current.trackId || ""))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = list.findIndex((grade) => grade.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    const swap = list[next];
    list[next] = list[index];
    list[index] = swap;
    list.forEach((grade, order) => { grade.order = order; });
    const byId = new Map(list.map((grade) => [grade.id, grade]));
    data.jobGrades = (data.jobGrades || []).map((grade) => byId.get(grade.id) || grade);
  });
}

export function employeeJobGrade(employee, data) {
  return orderedJobGrades(data).find((grade) => grade.id === employee?.profile?.gradeId) || null;
}

export function jobGradeLabel(grade) {
  return grade ? [grade.gradeNumber, grade.title || grade.name].filter(Boolean).join(" · ") : "";
}

export function matchJobGrade(data, text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  return orderedJobGrades(data).find((grade) => {
    const label = jobGradeLabel(grade);
    return label === raw
      || grade.title === raw
      || String(grade.gradeNumber) === raw
      || `${grade.gradeNumber} ${grade.title || ""}`.trim() === raw;
  }) || null;
}

export function parseGradeInput(text) {
  const raw = String(text || "").trim();
  const match = raw.match(/^(\d+)\s*[·.\-]?\s*(.+)$/);
  if (match) return { gradeNumber: match[1], title: match[2].trim() };
  return { gradeNumber: "", title: raw };
}

export function nextGradeNumber(data, trackId) {
  const siblings = orderedJobGrades(data).filter((grade) => !trackId || grade.trackId === trackId);
  const nums = siblings.map((grade) => Number.parseInt(grade.gradeNumber, 10)).filter((value) => Number.isFinite(value));
  return String((nums.length ? Math.max(...nums) : 0) + 1);
}