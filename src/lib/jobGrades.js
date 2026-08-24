import { updateCompany } from "@/lib/store";

export const DEFAULT_LADDER = [
  { ar: "مبتدئ", en: "Junior" },
  { ar: "متوسط", en: "Mid" },
  { ar: "أول", en: "Senior" },
  { ar: "مشرف", en: "Supervisor" },
  { ar: "مدير", en: "Manager" },
];

const LIST_PREFIX = {
  الفنيين: "TC",
  فني: "TC",
  الفني: "TC",
  "موظف ميداني": "TC",
  field: "TC",
  المهندسين: "EN",
  مهندس: "EN",
  المهندس: "EN",
  القيادة: "LD",
  "الموارد البشرية": "HR",
  "مسؤول موارد بشرية": "HR",
  hr_officer: "HR",
  السلامة: "HS",
  "مسؤول سلامة": "HS",
  safety_officer: "HS",
  المالية: "FN",
  "مسؤول مالية": "FN",
  finance_officer: "FN",
  IT: "IT",
  "مدير فرع": "BM",
  station_manager: "BM",
};

export function orderedJobGrades(data) {
  return [...(data?.jobGrades || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function gradesForList(data, listId) {
  if (!listId) return [];
  return orderedJobGrades(data).filter((grade) => grade.listId === listId);
}

function gradeNorm(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/الدرجة|درجه/g, "")
    .replace(/[·•]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function gradeParts(label) {
  const raw = String(label || "").trim();
  const split = raw.split(/\s*[·•\-–]\s*/).map((part) => part.trim()).filter(Boolean);
  if (split.length >= 2) return { gradeNumber: split[0], title: split.slice(1).join(" · ") };
  return { gradeNumber: "", title: raw };
}

export function findListGrade(data, listId, label) {
  const key = String(label || "").trim();
  if (!key) return null;
  const needle = gradeNorm(key);
  const parts = gradeParts(key);
  return gradesForList(data, listId).find((grade) => {
    const full = jobGradeLabel(grade);
    const title = String(grade.title || "").trim();
    const number = String(grade.gradeNumber || "").trim();
    return full === key
      || title === key
      || number === key
      || gradeNorm(full) === needle
      || gradeNorm(title) === needle
      || gradeNorm(number) === needle
      || (parts.title && gradeNorm(title) === gradeNorm(parts.title))
      || (parts.gradeNumber && gradeNorm(number) === gradeNorm(parts.gradeNumber));
  }) || null;
}

export function ensureListGrade(companyId, listId, label, listName = "") {
  const key = String(label || "").trim();
  if (!companyId || !listId || !key) return { ok: false };
  let id = "";
  updateCompany(companyId, (data) => {
    data.jobGrades = data.jobGrades || [];
    const hit = findListGrade(data, listId, key);
    if (hit) {
      id = hit.id;
      return;
    }
    const parsed = gradeParts(key);
    const title = parsed.title || key;
    let gradeNumber = parsed.gradeNumber;
    if (!gradeNumber || gradesForList(data, listId).some((grade) => String(grade.gradeNumber || "").trim() === gradeNumber)) {
      gradeNumber = nextGradeNumber(data, listId, listName);
    }
    id = `grade_${listId}_${uid()}`;
    data.jobGrades.push({
      id,
      listId,
      gradeNumber,
      title,
      order: nextOrder(data.jobGrades),
      minSalary: null,
      maxSalary: null,
      requiredCerts: [],
    });
  });
  return { ok: Boolean(id), id };
}

export function employeeJobGrade(employee, data) {
  return orderedJobGrades(data).find((grade) => grade.id === employee?.profile?.gradeId) || null;
}

export function jobGradeLabel(grade) {
  return grade ? [grade.gradeNumber, grade.title].filter(Boolean).join(" · ") : "";
}

export function gradeSalaryRange(grade) {
  const min = Number(grade?.minSalary);
  const max = Number(grade?.maxSalary);
  return {
    min: Number.isFinite(min) && min > 0 ? min : null,
    max: Number.isFinite(max) && max > 0 ? max : null,
  };
}

export function gradeHasSalaryRange(grade) {
  const { min, max } = gradeSalaryRange(grade);
  return min != null && max != null && max >= min;
}

export function listGradePrefix(name) {
  const key = String(name || "").trim();
  if (LIST_PREFIX[key]) return LIST_PREFIX[key];
  const stripped = key.replace(/^ال/, "");
  if (LIST_PREFIX[stripped]) return LIST_PREFIX[stripped];
  const ascii = key.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (ascii.length >= 2) return ascii.slice(0, 2);
  if (ascii.length === 1) return `${ascii}L`;
  return "GR";
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function nextOrder(list) {
  return list.reduce((max, grade) => Math.max(max, Number(grade.order) || 0), -1) + 1;
}

function nextGradeNumber(data, listId, listName = "") {
  const used = new Set(gradesForList(data, listId).map((grade) => String(grade.gradeNumber || "").trim()));
  const prefix = listGradePrefix(listName);
  let index = gradesForList(data, listId).length + 1;
  let gradeNumber = `${prefix}${index}`;
  while (used.has(gradeNumber)) {
    index += 1;
    gradeNumber = `${prefix}${index}`;
  }
  return gradeNumber;
}

export function seedDefaultLadder(companyId, listId, listName = "", ar = true) {
  if (!companyId || !listId) return { ok: false, added: 0 };
  let added = 0;
  updateCompany(companyId, (data) => {
    data.jobGrades = data.jobGrades || [];
    DEFAULT_LADDER.forEach((row) => {
      const title = ar ? row.ar : row.en;
      if (findListGrade(data, listId, title)) return;
      data.jobGrades.push({
        id: `grade_${listId}_${uid()}`,
        listId,
        gradeNumber: nextGradeNumber(data, listId, listName),
        title,
        titleEn: row.en,
        order: nextOrder(data.jobGrades),
        minSalary: null,
        maxSalary: null,
        requiredCerts: [],
      });
      added += 1;
    });
  });
  return { ok: added > 0, added };
}

export function removeListGrade(companyId, gradeId) {
  const id = String(gradeId || "").trim();
  if (!companyId || !id) return { ok: false };
  updateCompany(companyId, (data) => {
    data.jobGrades = (data.jobGrades || []).filter((grade) => grade.id !== id);
    (data.employees || []).forEach((employee) => {
      if (employee.profile?.gradeId === id) employee.profile.gradeId = null;
    });
    (data.orgSeats || []).forEach((seat) => {
      if (seat.gradeId === id) seat.gradeId = "";
    });
  });
  return { ok: true };
}

const PRESET_TITLES = new Set(DEFAULT_LADDER.map((row) => row.ar));

export function isPresetLadderGrade(grade) {
  if (!grade) return false;
  if (/^grade_tc[1-5]$/i.test(String(grade.id || ""))) return true;
  const title = String(grade.title || "").trim();
  const code = String(grade.gradeNumber || "").trim();
  return PRESET_TITLES.has(title) && /^(TC|EN|HR|HS|FN|BM|LD|GR)\d+$/i.test(code);
}

export function purgePresetLadders(data) {
  if (!data) return false;
  const removed = new Set();
  const next = (data.jobGrades || []).filter((grade) => {
    if (!isPresetLadderGrade(grade)) return true;
    removed.add(grade.id);
    return false;
  });
  if (!removed.size) return false;
  data.jobGrades = next;
  (data.orgSeats || []).forEach((seat) => {
    if (removed.has(seat.gradeId)) seat.gradeId = "";
  });
  (data.employees || []).forEach((employee) => {
    if (employee?.profile && removed.has(employee.profile.gradeId)) employee.profile.gradeId = null;
  });
  return true;
}

export function copyListLadder(companyId, fromListId, toListId, toListName) {
  if (!companyId || !fromListId || !toListId || fromListId === toListId) return { ok: false };
  let copied = 0;
  updateCompany(companyId, (data) => {
    data.jobGrades = data.jobGrades || [];
    const source = gradesForList(data, fromListId);
    if (!source.length) return;
    const used = new Set([
      ...(data.employees || []).map((employee) => employee.profile?.gradeId),
      ...(data.orgSeats || []).map((seat) => seat.gradeId),
    ].filter(Boolean));
    data.jobGrades = data.jobGrades.filter((grade) => grade.listId !== toListId || used.has(grade.id));
    const prefix = listGradePrefix(toListName);
    const start = nextOrder(data.jobGrades);
    source.forEach((grade, index) => {
      data.jobGrades.push({
        id: `grade_${toListId}_${index + 1}_${uid()}`,
        listId: toListId,
        gradeNumber: `${prefix}${index + 1}`,
        title: grade.title,
        titleEn: grade.titleEn || "",
        order: start + index,
        minSalary: grade.minSalary ?? null,
        maxSalary: grade.maxSalary ?? null,
      });
      copied += 1;
    });
  });
  return { ok: copied > 0, copied };
}

export function createListGrade(companyId, input) {
  const listId = String(input?.listId || "").trim();
  const title = String(input?.title || input?.gradeNumber || "").trim();
  if (!companyId || !listId || !title) return { ok: false, error: "FIELDS" };
  const min = Number(input.minSalary);
  const max = Number(input.maxSalary);
  let id = "";
  updateCompany(companyId, (data) => {
    data.jobGrades = data.jobGrades || [];
    if (findListGrade(data, listId, title)) return;
    const pack = (data.permissionTemplates || []).find((item) => item.id === listId);
    const listName = pack?.ar || pack?.en || "";
    const requested = String(input?.gradeNumber || "").trim();
    const gradeNumber = requested && !gradesForList(data, listId).some((grade) => String(grade.gradeNumber || "").trim() === requested)
      ? requested
      : nextGradeNumber(data, listId, listName);
    id = `grade_${listId}_${uid()}`;
    data.jobGrades.push({
      id,
      listId,
      gradeNumber,
      title,
      order: nextOrder(data.jobGrades),
      minSalary: Number.isFinite(min) && min > 0 ? min : null,
      maxSalary: Number.isFinite(max) && max > 0 ? max : null,
      requiredCerts: Array.isArray(input.requiredCerts) ? input.requiredCerts : [],
    });
  });
  return { ok: Boolean(id), id };
}

export function structurePublishIssues() {
  return [];
}

export function publishOrgStructure(companyId, data, ar = true) {
  const issues = structurePublishIssues(data, ar);
  if (issues.length) return { ok: false, issues };
  updateCompany(companyId, (company) => {
    company.settings = { ...(company.settings || {}), orgPublishedAt: new Date().toISOString() };
  });
  return { ok: true };
}
