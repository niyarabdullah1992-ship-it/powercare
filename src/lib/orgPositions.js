import { getCompanyData, updateCompany } from "@/lib/store";
import { addJobGrade, employeeJobGrade } from "@/lib/jobGrades";
import { GRANTABLE_DEPARTMENTS, saveSmartPosition } from "@/lib/smartPositions";
import { OWNER_ONLY_DEPARTMENTS } from "@/lib/permissionTemplates";
import { orgTrackById } from "@/lib/orgTracks";

const TEMPLATE_TRACK = {
  field: "track_ops",
  safety_officer: "track_ops",
  station_manager: "track_lead",
  finance_officer: "track_admin",
  hr_officer: "track_admin",
};

export function trackForTemplate(templateId) {
  return TEMPLATE_TRACK[templateId] || "track_admin";
}

export const POSITION_ACCESS = ["hidden", "own", "station", "view", "manage"];

export const POSITION_ACCESS_LABEL = {
  hidden: { ar: "لا يرى", en: "Hidden", fullAr: "لا يرى القسم", fullEn: "Cannot see the section" },
  own: { ar: "خاصته", en: "Own", fullAr: "سجلاته هو فقط", fullEn: "Own records only" },
  station: { ar: "فرعه", en: "Branch", fullAr: "فرعه فقط", fullEn: "Their branch only" },
  view: { ar: "عرض", en: "View", fullAr: "يرى القسم في الشركة", fullEn: "Can see the section company-wide" },
  manage: { ar: "تحكم كامل", en: "Control", fullAr: "يعمل في القسم بالكامل", fullEn: "Full control of the section" },
};

export function orderedOrgPositions(data) {
  return [...(data?.orgPositions || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
}

export function positionsForTrack(data, trackId) {
  const positions = orderedOrgPositions(data);
  if (!trackId) return positions;
  return positions.filter((item) => item.trackId === trackId);
}

export function orgPositionById(data, id) {
  return (data?.orgPositions || []).find((item) => item.id === id) || null;
}

export function employeeOrgSeat(employee, data) {
  const title = String(employee?.profile?.position || employee?.position || "").trim();
  const seats = orderedOrgPositions(data);
  const byId = employee?.profile?.positionId
    ? seats.find((item) => item.id === employee.profile.positionId)
    : null;
  const byTitle = title ? seats.find((item) => item.title === title) : null;
  const position = byId || byTitle || null;
  const grade = employeeJobGrade(employee, data);
  const track = orgTrackById(data, position?.trackId || grade?.trackId || employee?.profile?.trackId);
  return {
    title: position?.title || title,
    position,
    grade,
    track,
    permissions: position?.permissions || {},
  };
}

export function countPositionAccess(permissions = {}) {
  const counts = { hidden: 0, own: 0, station: 0, view: 0, manage: 0 };
  GRANTABLE_DEPARTMENTS.forEach((department) => {
    const access = permissions[department.id] && permissions[department.id] !== "hidden"
      ? permissions[department.id]
      : "hidden";
    counts[access] += 1;
  });
  return counts;
}

export function summarizePositionAccess(permissions = {}, ar = true) {
  const bits = GRANTABLE_DEPARTMENTS
    .filter((department) => permissions[department.id] && permissions[department.id] !== "hidden")
    .map((department) => {
      const access = permissions[department.id];
      const lab = POSITION_ACCESS_LABEL[access] || POSITION_ACCESS_LABEL.hidden;
      return `${ar ? department.ar : department.en}: ${ar ? lab.ar : lab.en}`;
    });
  return bits.length ? bits.slice(0, 4).join(" · ") + (bits.length > 4 ? ` +${bits.length - 4}` : "") : (ar ? "بلا أقسام" : "No sections");
}

export function saveOrgPosition(companyId, { id, title, permissions, trackId }, ownerMode = false) {
  const name = String(title || "").trim();
  if (!companyId || !name || !trackId) return null;
  const nextPerms = { ...(permissions || {}) };
  if (!ownerMode) {
    OWNER_ONLY_DEPARTMENTS.forEach((key) => {
      if (nextPerms[key] === "manage") nextPerms[key] = "view";
    });
  }
  let savedId = id || "";
  updateCompany(companyId, (data) => {
    data.orgPositions = data.orgPositions || [];
    const index = savedId ? data.orgPositions.findIndex((item) => item.id === savedId) : -1;
    if (index >= 0) {
      const previous = data.orgPositions[index];
      const oldTitle = previous.title;
      data.orgPositions[index] = {
        ...previous,
        title: name,
        trackId,
        permissions: nextPerms,
        updatedAt: new Date().toISOString(),
      };
      savedId = data.orgPositions[index].id;
      if (oldTitle && oldTitle !== name) {
        (data.employees || []).forEach((employee) => {
          if ((employee.profile?.position || employee.position) === oldTitle) {
            employee.profile = { ...(employee.profile || {}), position: name };
            employee.position = name;
          }
        });
        (data.smartPositions || []).forEach((item) => {
          if (item.title === oldTitle) item.title = name;
        });
        (data.orgTree || []).forEach((node) => {
          if (node.type === "employee" && node.title === oldTitle) node.title = name;
        });
      }
      return;
    }
    savedId = `pos_${Date.now().toString(36)}`;
    data.orgPositions.push({
      id: savedId,
      title: name,
      trackId,
      permissions: nextPerms,
      order: data.orgPositions.length,
      updatedAt: new Date().toISOString(),
    });
  });
  return savedId;
}

export function deleteOrgPosition(companyId, id) {
  if (!companyId || !id) return;
  updateCompany(companyId, (data) => {
    data.orgPositions = (data.orgPositions || []).filter((item) => item.id !== id);
    data.orgPositions.forEach((item, order) => { item.order = order; });
  });
}

export function moveOrgPosition(companyId, id, direction) {
  if (!companyId || !id) return;
  updateCompany(companyId, (data) => {
    const current = (data.orgPositions || []).find((item) => item.id === id);
    if (!current) return;
    const list = (data.orgPositions || [])
      .filter((item) => (item.trackId || "") === (current.trackId || ""))
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    const index = list.findIndex((item) => item.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= list.length) return;
    const swap = list[next];
    list[next] = list[index];
    list[index] = swap;
    list.forEach((item, order) => { item.order = order; });
    const byId = new Map(list.map((item) => [item.id, item]));
    data.orgPositions = (data.orgPositions || []).map((item) => byId.get(item.id) || item);
  });
}

export function assignOrgPosition(companyId, employeeId, positionId) {
  return assignOrgSeat(companyId, { employeeId, positionId });
}

export function assignOrgSeat(companyId, payload = {}, ownerMode = false) {
  const {
    employeeId,
    positionId = "",
    title = "",
    permissions,
    trackId = "",
    gradeId,
    newGrade,
  } = payload;
  if (!companyId || !employeeId) return { ok: false };

  let resolvedPositionId = positionId;
  if (!resolvedPositionId && String(title || "").trim()) {
    resolvedPositionId = saveOrgPosition(companyId, {
      title,
      permissions: permissions || {},
      trackId: trackId || "track_admin",
    }, ownerMode);
    if (!resolvedPositionId) return { ok: false };
  }

  let resolvedGradeId = gradeId;
  if (newGrade && String(newGrade.gradeNumber || "").trim() && String(newGrade.title || "").trim()) {
    const created = addJobGrade(
      companyId,
      newGrade.gradeNumber,
      newGrade.title,
      newGrade.trackId || trackId || "track_admin",
    );
    if (!created) return { ok: false };
    resolvedGradeId = created.id;
  }

  const snapshot = getCompanyData(companyId);
  const position = resolvedPositionId
    ? (snapshot?.orgPositions || []).find((item) => item.id === resolvedPositionId)
    : null;
  if (resolvedPositionId && !position) return { ok: false };
  if (!position && resolvedGradeId === undefined) return { ok: false };

  if (position) {
    saveSmartPosition(companyId, employeeId, position.title, position.permissions || {}, true);
  }
  updateCompany(companyId, (data) => {
    const employee = (data.employees || []).find((item) => item.id === employeeId);
    if (!employee) return;
    const next = { ...(employee.profile || {}) };
    if (position) {
      next.position = position.title;
      next.positionId = position.id;
      next.trackId = position.trackId;
      employee.position = position.title;
    }
    if (resolvedGradeId !== undefined) next.gradeId = resolvedGradeId || null;
    employee.profile = next;
  });
  return { ok: true, title: position?.title || "", gradeId: resolvedGradeId || "" };
}
