/** Client mirror of base44/shared/fileArchiveDerivations.ts
 *  Keep in sync — Files / smart archive permission scopes + station binding + folder cycles.
 */

export const ACCESS_SCOPES = ["restricted", "all_staff", "hr", "supervisors"];

export const ACCESS_LABELS = {
  restricted: { ar: "مقيّد", en: "Restricted" },
  all_staff: { ar: "عام", en: "All staff" },
  hr: { ar: "الموارد البشرية", en: "HR only" },
  supervisors: { ar: "مشرفون", en: "Supervisors" },
};

const HR_ROLES = new Set([
  "owner", "director", "ops_manager", "admin", "hr_manager", "hr", "pgm",
]);

const SUPERVISOR_ROLES = new Set([
  "owner", "director", "ops_manager", "admin", "pgm", "station_manager",
]);

const RESTRICTED_ROLES = new Set([
  "owner", "director", "ops_manager", "admin",
]);

export function normalizeAccess(raw) {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "restricted" || v === "all_staff" || v === "hr" || v === "supervisors") {
    return v;
  }
  if (v.includes("restrict") || v === "مقيّد") return "restricted";
  if (v.includes("hr") || v.includes("موارد")) return "hr";
  if (v.includes("supervis") || v.includes("مشرف")) return "supervisors";
  return "all_staff";
}

export function roleCanAccessScope(actor, access) {
  if (!actor) return false;
  if (actor.owner || actor.admin) return true;
  const scope = normalizeAccess(access);
  const role = String(actor.role || "").toLowerCase();
  if (scope === "all_staff") return true;
  if (scope === "hr") return HR_ROLES.has(role);
  if (scope === "supervisors") return SUPERVISOR_ROLES.has(role);
  if (scope === "restricted") return RESTRICTED_ROLES.has(role);
  return false;
}

export function actorCanSeeStation(actor, stationId, companyWide) {
  if (!actor) return false;
  if (actor.owner || actor.admin) return true;
  if (companyWide) return true;
  const role = String(actor.role || "").toLowerCase();
  if (["owner", "director", "ops_manager", "admin", "hr_manager", "hr"].includes(role)) {
    return true;
  }
  const allowed = new Set();
  if (actor.stationId) allowed.add(actor.stationId);
  for (const id of actor.stationIds || []) {
    if (id) allowed.add(id);
  }
  if (!stationId) return false;
  if (allowed.size === 0) return true;
  return allowed.has(stationId);
}

export function inferKind(name, explicit) {
  if (explicit) {
    const u = String(explicit).toUpperCase();
    if (u === "PDF" || u === "XLSX" || u === "DWG" || u === "DOC" || u === "IMG") return u;
  }
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (ext === "pdf") return "PDF";
  if (ext === "xlsx" || ext === "xls" || ext === "csv") return "XLSX";
  if (ext === "dwg" || ext === "dxf") return "DWG";
  if (ext === "doc" || ext === "docx") return "DOC";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "IMG";
  return "FILE";
}

export function formatSizeBytes(bytes) {
  const n = Math.max(0, Number(bytes) || 0);
  if (n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = n / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

export function wouldCreateFolderCycle(nodes, folderId, candidateParentId) {
  if (!candidateParentId) return false;
  if (candidateParentId === folderId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur = byId.get(candidateParentId);
  const seen = new Set();
  while (cur) {
    if (cur.id === folderId) return true;
    if (seen.has(cur.id)) return true;
    seen.add(cur.id);
    const pid = cur.parentId || null;
    if (!pid) break;
    cur = byId.get(pid);
  }
  return false;
}

export function findFolderCycle(nodes) {
  const folders = nodes.filter((n) => n.type === "folder");
  const byId = new Map(folders.map((n) => [n.id, n]));
  for (const start of folders) {
    const seen = new Set();
    let cur = start;
    while (cur) {
      if (seen.has(cur.id)) return cur.id;
      seen.add(cur.id);
      const pid = cur.parentId || null;
      if (!pid) break;
      cur = byId.get(pid);
    }
  }
  return null;
}

export function resolveFolderAccess(nodes, node) {
  if (node.type === "folder") return normalizeAccess(node.access);
  if (node.access) return normalizeAccess(node.access);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur = node.parentId ? byId.get(node.parentId) : undefined;
  const seen = new Set();
  while (cur) {
    if (cur.type === "folder") return normalizeAccess(cur.access);
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return "all_staff";
}

export function checkAccessGate(actor, nodes, node) {
  if (!node) {
    return {
      ok: false,
      error: "NODE_NOT_FOUND",
      reason: "المستند أو المجلد غير موجود.",
      reasonEn: "Document or folder not found.",
    };
  }
  const access = resolveFolderAccess(nodes, node);
  if (!roleCanAccessScope(actor, access)) {
    const label = ACCESS_LABELS[access];
    return {
      ok: false,
      error: "ACCESS_DENIED_BY_SCOPE",
      reason: `الوصول مرفوض — هذا المحتوى ضمن نطاق «${label.ar}».`,
      reasonEn: `Access denied — this content is scoped «${label.en}».`,
      access,
    };
  }
  const companyWide = !!node.companyWide || node.stationId === "all";
  if (!actorCanSeeStation(actor, node.stationId, companyWide)) {
    return {
      ok: false,
      error: "ACCESS_DENIED_BY_SCOPE",
      reason: "الوصول مرفوض — المستند مربوط بمحطة خارج نطاقك.",
      reasonEn: "Access denied — document is bound to a station outside your scope.",
      access,
    };
  }
  return { ok: true, access };
}

export function checkStationBindingGate(input) {
  const companyWide = !!input.companyWide || input.stationId === "all";
  if (companyWide) return { ok: true, companyWide: true, stationId: null };
  const sid = typeof input.stationId === "string" ? input.stationId.trim() : "";
  if (!sid) {
    return {
      ok: false,
      error: "MISSING_STATION_BINDING",
      reason: "يلزم ربط المستند بمحطة — أو تعليمه على مستوى الشركة.",
      reasonEn: "Document must be bound to a station — or marked company-wide.",
    };
  }
  return { ok: true, companyWide: false, stationId: sid };
}

export function checkCreateFolderGate(input) {
  const name = String(input.name || "").trim();
  if (!name) {
    return {
      ok: false,
      error: "NAME_REQUIRED",
      reason: "اسم المجلد مطلوب.",
      reasonEn: "Folder name is required.",
    };
  }
  const access = normalizeAccess(input.access);
  if (input.folderId && input.parentId != null) {
    const cycle = wouldCreateFolderCycle(input.nodes || [], input.folderId, input.parentId);
    if (cycle) {
      return {
        ok: false,
        error: "FOLDER_CYCLE",
        reason: "لا يمكن نقل المجلد إلى فرع داخله — ذلك يُنشئ دورة.",
        reasonEn: "Cannot move a folder under its own descendant — that would create a cycle.",
      };
    }
  }
  return { ok: true, name, access };
}

export function checkMoveFolderGate(nodes, folderId, newParentId) {
  const folder = nodes.find((n) => n.id === folderId && n.type === "folder");
  if (!folder) {
    return {
      ok: false,
      error: "FOLDER_NOT_FOUND",
      reason: "المجلد غير موجود.",
      reasonEn: "Folder not found.",
    };
  }
  if (newParentId) {
    const parent = nodes.find((n) => n.id === newParentId);
    if (!parent || parent.type !== "folder") {
      return {
        ok: false,
        error: "PARENT_NOT_FOUND",
        reason: "المجلد الأب غير موجود.",
        reasonEn: "Parent folder not found.",
      };
    }
  }
  if (wouldCreateFolderCycle(nodes, folderId, newParentId)) {
    return {
      ok: false,
      error: "FOLDER_CYCLE",
      reason: "لا يمكن نقل المجلد إلى فرع داخله — ذلك يُنشئ دورة.",
      reasonEn: "Cannot move a folder under its own descendant — that would create a cycle.",
    };
  }
  return { ok: true };
}

export function checkUploadGate(input) {
  const name = String(input.name || "").trim();
  if (!name) {
    return {
      ok: false,
      error: "NAME_REQUIRED",
      reason: "اسم الملف مطلوب.",
      reasonEn: "File name is required.",
    };
  }
  const bind = checkStationBindingGate({
    stationId: input.stationId,
    companyWide: input.companyWide,
  });
  if (!bind.ok) return bind;

  const nodes = input.nodes || [];
  if (input.folderId) {
    const folder = nodes.find((n) => n.id === input.folderId && n.type === "folder");
    if (!folder) {
      return {
        ok: false,
        error: "FOLDER_NOT_FOUND",
        reason: "المجلد غير موجود.",
        reasonEn: "Folder not found.",
      };
    }
    const accessGate = checkAccessGate(input.actor, nodes, folder);
    if (!accessGate.ok) return accessGate;
  }
  return {
    ok: true,
    name,
    stationId: bind.stationId,
    companyWide: bind.companyWide,
  };
}

function isUnderFolder(nodes, node, folderId) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur = node;
  const seen = new Set();
  while (cur) {
    if (cur.parentId === folderId) return true;
    if (!cur.parentId || seen.has(cur.id)) return false;
    seen.add(cur.id);
    cur = byId.get(cur.parentId);
  }
  return false;
}

export function countFilesInFolder(nodes, folderId, actor) {
  return nodes.filter((n) => {
    if (n.type !== "file") return false;
    if (!isUnderFolder(nodes, n, folderId)) return false;
    if (actor && !checkAccessGate(actor, nodes, n).ok) return false;
    return true;
  }).length;
}

export function latestUpdateInFolder(nodes, folderId) {
  let latest = null;
  for (const n of nodes) {
    if (n.type !== "file") continue;
    if (n.parentId !== folderId && !isUnderFolder(nodes, n, folderId)) continue;
    const at = n.updatedAt || n.createdAt || null;
    if (at && (!latest || at > latest)) latest = at;
  }
  return latest;
}

function relativeDayLabel(iso, nowMs, lang) {
  if (!iso) return lang === "ar" ? "لا تحديث بعد" : "no updates yet";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return lang === "ar" ? "لا تحديث بعد" : "no updates yet";
  const startToday = new Date(nowMs);
  startToday.setHours(0, 0, 0, 0);
  const startThat = new Date(t);
  startThat.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((startToday.getTime() - startThat.getTime()) / 86_400_000);
  if (dayDiff === 0) return lang === "ar" ? "آخر تحديث اليوم" : "updated today";
  if (dayDiff === 1) return lang === "ar" ? "آخر تحديث أمس" : "updated yesterday";
  if (dayDiff > 1 && dayDiff < 14) {
    return lang === "ar" ? `آخر تحديث قبل ${dayDiff} أيام` : `updated ${dayDiff} days ago`;
  }
  const d = startThat.getDate();
  const m = startThat.getMonth() + 1;
  return lang === "ar" ? `آخر تحديث ${d}/${m}` : `updated ${m}/${d}`;
}

export function enrichFolder(folder, nodes, actor, nowMs = Date.now()) {
  const access = normalizeAccess(folder.access);
  const label = ACCESS_LABELS[access];
  const fileCount = countFilesInFolder(nodes, folder.id, actor);
  const latest = latestUpdateInFolder(nodes, folder.id) || folder.updatedAt || folder.createdAt;
  return {
    ...folder,
    access,
    accessLabelAr: label.ar,
    accessLabelEn: label.en,
    fileCount,
    latestAt: latest || null,
    updatedLabelAr: relativeDayLabel(latest, nowMs, "ar"),
    updatedLabelEn: relativeDayLabel(latest, nowMs, "en"),
    metaAr: `${fileCount} ملفًا · ${relativeDayLabel(latest, nowMs, "ar")}`,
    metaEn: `${fileCount} files · ${relativeDayLabel(latest, nowMs, "en")}`,
  };
}

export function enrichFile(file, nodes, actor, nowMs = Date.now()) {
  const access = resolveFolderAccess(nodes, file);
  const label = ACCESS_LABELS[access];
  const kind = inferKind(file.name, file.kind);
  const companyWide = !!file.companyWide || file.stationId === "all";
  const gate = checkAccessGate(actor, nodes, file);
  const at = file.updatedAt || file.createdAt || null;
  return {
    ...file,
    access,
    accessLabelAr: label.ar,
    accessLabelEn: label.en,
    kind,
    companyWide,
    sizeLabel: formatSizeBytes(file.sizeBytes),
    updatedLabelAr: relativeDayLabel(at, nowMs, "ar"),
    updatedLabelEn: relativeDayLabel(at, nowMs, "en"),
    visible: gate.ok,
    denyReason: gate.ok ? null : gate.error,
  };
}

export function filterByStationScope(nodes, scope) {
  if (!scope || scope === "all") return nodes;
  return nodes.filter((n) => n.companyWide || n.stationId === "all" || n.stationId === scope);
}

export function deriveVisibleFolders(nodes, actor, opts = {}) {
  const parentId = opts.parentId === undefined ? null : opts.parentId;
  const scoped = filterByStationScope(nodes, opts.stationScope);
  return scoped
    .filter((n) => n.type === "folder" && (n.parentId || null) === parentId)
    .filter((n) => checkAccessGate(actor, nodes, n).ok)
    .map((f) => enrichFolder(f, nodes, actor));
}

export function deriveRecentFiles(nodes, actor, opts = {}) {
  const scoped = filterByStationScope(nodes, opts.stationScope);
  let files = scoped
    .filter((n) => n.type === "file")
    .map((f) => enrichFile(f, nodes, actor))
    .filter((f) => f.visible);

  if (opts.folderId) {
    files = files.filter(
      (f) => f.parentId === opts.folderId || isUnderFolder(nodes, f, opts.folderId),
    );
  }

  files.sort((a, b) => {
    const ta = Date.parse(a.updatedAt || a.createdAt || "") || 0;
    const tb = Date.parse(b.updatedAt || b.createdAt || "") || 0;
    return tb - ta;
  });

  const limit = opts.limit ?? 50;
  return files.slice(0, limit);
}

export function deriveArchiveStats(nodes, actor, opts = {}) {
  const folders = deriveVisibleFolders(nodes, actor, {
    stationScope: opts.stationScope,
    parentId: null,
  });
  const files = deriveRecentFiles(nodes, actor, {
    stationScope: opts.stationScope,
    limit: 10_000,
  });
  const byAccess = {
    restricted: 0,
    all_staff: 0,
    hr: 0,
    supervisors: 0,
  };
  for (const f of files) {
    const a = normalizeAccess(f.access);
    byAccess[a] = (byAccess[a] || 0) + 1;
  }
  const stations = new Set(
    files.filter((f) => f.stationId && f.stationId !== "all" && !f.companyWide).map((f) => f.stationId),
  );
  return {
    folderCount: folders.length,
    fileCount: files.length,
    stationCount: stations.size,
    byAccess,
  };
}
