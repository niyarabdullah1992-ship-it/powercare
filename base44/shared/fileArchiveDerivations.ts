/** Smart archive / Files — permission-scoped documents linked to stations.
 *  Design: NiroVera Platform.dc.html (files / folders / recentFiles).
 *  Folder meta counts and recent lists are derived from the node list — never stored literals.
 */

/** Access level on a folder (and inherited by documents inside). */
export type FileAccessScope = "restricted" | "all_staff" | "hr" | "supervisors";

export type FileNodeType = "folder" | "file";

export type FileKind = "PDF" | "XLSX" | "DWG" | "DOC" | "IMG" | "FILE";

export type ArchiveActor = {
  role?: string | null;
  stationId?: string | null;
  owner?: boolean;
  admin?: boolean;
  /** Extra station ids the actor may see (managedStations / HR scope). */
  stationIds?: string[] | null;
};

export type ArchiveNodeLike = {
  id: string;
  companyId?: string;
  type: FileNodeType | string;
  name: string;
  parentId?: string | null;
  /** Folder access; files inherit from their folder (or own override). */
  access?: FileAccessScope | string | null;
  /** Station binding — null only when companyWide is true. */
  stationId?: string | null;
  stationName?: string | null;
  /** Explicit company-wide document (design: "All stations"). */
  companyWide?: boolean;
  kind?: FileKind | string | null;
  sizeBytes?: number | null;
  url?: string | null;
  uploadedBy?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

export const ACCESS_SCOPES: FileAccessScope[] = [
  "restricted",
  "all_staff",
  "hr",
  "supervisors",
];

export const ACCESS_LABELS: Record<FileAccessScope, { ar: string; en: string }> = {
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

export function normalizeAccess(raw?: string | null): FileAccessScope {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "restricted" || v === "all_staff" || v === "hr" || v === "supervisors") {
    return v;
  }
  // Prototype display strings / aliases
  if (v.includes("restrict") || v === "مقيّد") return "restricted";
  if (v.includes("hr") || v.includes("موارد")) return "hr";
  if (v.includes("supervis") || v.includes("مشرف")) return "supervisors";
  return "all_staff";
}

/** Whether the actor's role may read this access scope. */
export function roleCanAccessScope(
  actor: ArchiveActor | null | undefined,
  access: FileAccessScope | string | null | undefined,
): boolean {
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

/** Station visibility: company-wide always ok; otherwise station must match actor scope. */
export function actorCanSeeStation(
  actor: ArchiveActor | null | undefined,
  stationId: string | null | undefined,
  companyWide?: boolean,
): boolean {
  if (!actor) return false;
  if (actor.owner || actor.admin) return true;
  if (companyWide) return true;
  const role = String(actor.role || "").toLowerCase();
  // Company-wide roles see every station
  if (["owner", "director", "ops_manager", "admin", "hr_manager", "hr"].includes(role)) {
    return true;
  }
  const allowed = new Set<string>();
  if (actor.stationId) allowed.add(actor.stationId);
  for (const id of actor.stationIds || []) {
    if (id) allowed.add(id);
  }
  // Unscoped station-bound roles with no stations → deny station-bound docs
  if (!stationId) return false;
  if (allowed.size === 0) return true; // no station filter configured → permissive within role
  return allowed.has(stationId);
}

export function inferKind(name: string, explicit?: string | null): FileKind {
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

export function formatSizeBytes(bytes?: number | null): string {
  const n = Math.max(0, Number(bytes) || 0);
  if (n <= 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  const mb = n / (1024 * 1024);
  return mb >= 10 ? `${Math.round(mb)} MB` : `${mb.toFixed(1)} MB`;
}

/** Walk ancestors; detect if `candidateParentId` is the node or a descendant of `folderId`. */
export function wouldCreateFolderCycle(
  nodes: ArchiveNodeLike[],
  folderId: string,
  candidateParentId: string | null | undefined,
): boolean {
  if (!candidateParentId) return false;
  if (candidateParentId === folderId) return true;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur: ArchiveNodeLike | undefined = byId.get(candidateParentId);
  const seen = new Set<string>();
  while (cur) {
    if (cur.id === folderId) return true;
    if (seen.has(cur.id)) return true; // already cyclic tree
    seen.add(cur.id);
    const pid = cur.parentId || null;
    if (!pid) break;
    cur = byId.get(pid);
  }
  return false;
}

/** Detect any existing cycle in the folder graph (orphan self-loops / loops). */
export function findFolderCycle(nodes: ArchiveNodeLike[]): string | null {
  const folders = nodes.filter((n) => n.type === "folder");
  const byId = new Map(folders.map((n) => [n.id, n]));
  for (const start of folders) {
    const seen = new Set<string>();
    let cur: ArchiveNodeLike | undefined = start;
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

export function resolveFolderAccess(
  nodes: ArchiveNodeLike[],
  node: ArchiveNodeLike,
): FileAccessScope {
  if (node.type === "folder") return normalizeAccess(node.access);
  if (node.access) return normalizeAccess(node.access);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur: ArchiveNodeLike | undefined = node.parentId ? byId.get(node.parentId) : undefined;
  const seen = new Set<string>();
  while (cur) {
    if (cur.type === "folder") return normalizeAccess(cur.access);
    if (seen.has(cur.id)) break;
    seen.add(cur.id);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return "all_staff";
}

export function checkAccessGate(
  actor: ArchiveActor | null | undefined,
  nodes: ArchiveNodeLike[],
  node: ArchiveNodeLike | null | undefined,
) {
  if (!node) {
    return {
      ok: false as const,
      error: "NODE_NOT_FOUND",
      reason: "المستند أو المجلد غير موجود.",
      reasonEn: "Document or folder not found.",
    };
  }
  const access = resolveFolderAccess(nodes, node);
  if (!roleCanAccessScope(actor, access)) {
    const label = ACCESS_LABELS[access];
    return {
      ok: false as const,
      error: "ACCESS_DENIED_BY_SCOPE",
      reason: `الوصول مرفوض — هذا المحتوى ضمن نطاق «${label.ar}».`,
      reasonEn: `Access denied — this content is scoped «${label.en}».`,
      access,
    };
  }
  const companyWide = !!node.companyWide || node.stationId === "all";
  if (!actorCanSeeStation(actor, node.stationId, companyWide)) {
    return {
      ok: false as const,
      error: "ACCESS_DENIED_BY_SCOPE",
      reason: "الوصول مرفوض — المستند مربوط بفرع خارج نطاقك.",
      reasonEn: "Access denied — document is bound to a station outside your scope.",
      access,
    };
  }
  return { ok: true as const, access };
}

export function checkStationBindingGate(input: {
  stationId?: string | null;
  companyWide?: boolean;
  type?: string;
}) {
  const companyWide = !!input.companyWide || input.stationId === "all";
  if (companyWide) return { ok: true as const, companyWide: true as const, stationId: null as string | null };
  const sid = typeof input.stationId === "string" ? input.stationId.trim() : "";
  if (!sid) {
    return {
      ok: false as const,
      error: "MISSING_STATION_BINDING",
      reason: "يلزم ربط المستند بفرع — أو تعليمه على مستوى الشركة.",
      reasonEn: "Document must be bound to a station — or marked company-wide.",
    };
  }
  return { ok: true as const, companyWide: false as const, stationId: sid };
}

export function checkCreateFolderGate(input: {
  name?: string | null;
  access?: string | null;
  parentId?: string | null;
  nodes?: ArchiveNodeLike[];
  folderId?: string | null; // when moving
}) {
  const name = String(input.name || "").trim();
  if (!name) {
    return {
      ok: false as const,
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
        ok: false as const,
        error: "FOLDER_CYCLE",
        reason: "لا يمكن نقل المجلد إلى فرع داخله — ذلك يُنشئ دورة.",
        reasonEn: "Cannot move a folder under its own descendant — that would create a cycle.",
      };
    }
  }
  return { ok: true as const, name, access };
}

export function checkMoveFolderGate(
  nodes: ArchiveNodeLike[],
  folderId: string,
  newParentId: string | null | undefined,
) {
  const folder = nodes.find((n) => n.id === folderId && n.type === "folder");
  if (!folder) {
    return {
      ok: false as const,
      error: "FOLDER_NOT_FOUND",
      reason: "المجلد غير موجود.",
      reasonEn: "Folder not found.",
    };
  }
  if (newParentId) {
    const parent = nodes.find((n) => n.id === newParentId);
    if (!parent || parent.type !== "folder") {
      return {
        ok: false as const,
        error: "PARENT_NOT_FOUND",
        reason: "المجلد الأب غير موجود.",
        reasonEn: "Parent folder not found.",
      };
    }
  }
  if (wouldCreateFolderCycle(nodes, folderId, newParentId)) {
    return {
      ok: false as const,
      error: "FOLDER_CYCLE",
      reason: "لا يمكن نقل المجلد إلى فرع داخله — ذلك يُنشئ دورة.",
      reasonEn: "Cannot move a folder under its own descendant — that would create a cycle.",
    };
  }
  return { ok: true as const };
}

export function checkUploadGate(input: {
  name?: string | null;
  stationId?: string | null;
  companyWide?: boolean;
  folderId?: string | null;
  nodes?: ArchiveNodeLike[];
  actor?: ArchiveActor | null;
}) {
  const name = String(input.name || "").trim();
  if (!name) {
    return {
      ok: false as const,
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
        ok: false as const,
        error: "FOLDER_NOT_FOUND",
        reason: "المجلد غير موجود.",
        reasonEn: "Folder not found.",
      };
    }
    const accessGate = checkAccessGate(input.actor, nodes, folder);
    if (!accessGate.ok) return accessGate;
  }
  return {
    ok: true as const,
    name,
    stationId: bind.stationId,
    companyWide: bind.companyWide,
  };
}

/** Count files under a folder (any depth) that the actor may see. */
export function countFilesInFolder(
  nodes: ArchiveNodeLike[],
  folderId: string,
  actor?: ArchiveActor | null,
): number {
  return nodes.filter((n) => {
    if (n.type !== "file") return false;
    if (!isUnderFolder(nodes, n, folderId)) return false;
    if (actor && !checkAccessGate(actor, nodes, n).ok) return false;
    return true;
  }).length;
}

function isUnderFolder(nodes: ArchiveNodeLike[], node: ArchiveNodeLike, folderId: string): boolean {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  let cur: ArchiveNodeLike | undefined = node;
  const seen = new Set<string>();
  while (cur) {
    if (cur.parentId === folderId) return true;
    if (!cur.parentId || seen.has(cur.id)) return false;
    seen.add(cur.id);
    cur = byId.get(cur.parentId);
  }
  return false;
}

export function latestUpdateInFolder(
  nodes: ArchiveNodeLike[],
  folderId: string,
): string | null {
  let latest: string | null = null;
  for (const n of nodes) {
    if (n.type !== "file") continue;
    if (n.parentId !== folderId && !isUnderFolder(nodes, n, folderId)) continue;
    const at = n.updatedAt || n.createdAt || null;
    if (at && (!latest || at > latest)) latest = at;
  }
  return latest;
}

export function enrichFolder(
  folder: ArchiveNodeLike,
  nodes: ArchiveNodeLike[],
  actor?: ArchiveActor | null,
  nowMs = Date.now(),
) {
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

export function enrichFile(
  file: ArchiveNodeLike,
  nodes: ArchiveNodeLike[],
  actor?: ArchiveActor | null,
  nowMs = Date.now(),
) {
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

function relativeDayLabel(iso: string | null | undefined, nowMs: number, lang: "ar" | "en"): string {
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

/** Filter nodes by station scope picker (header). */
export function filterByStationScope<T extends ArchiveNodeLike>(
  nodes: T[],
  scope: string | null | undefined,
): T[] {
  if (!scope || scope === "all") return nodes;
  return nodes.filter((n) => n.companyWide || n.stationId === "all" || n.stationId === scope);
}

/** Folders visible to actor (root-level by default for board). */
export function deriveVisibleFolders(
  nodes: ArchiveNodeLike[],
  actor: ArchiveActor | null | undefined,
  opts: { stationScope?: string | null; parentId?: string | null } = {},
) {
  const parentId = opts.parentId === undefined ? null : opts.parentId;
  const scoped = filterByStationScope(nodes, opts.stationScope);
  return scoped
    .filter((n) => n.type === "folder" && (n.parentId || null) === parentId)
    .filter((n) => checkAccessGate(actor, nodes, n).ok)
    .map((f) => enrichFolder(f, nodes, actor));
}

/** Recent files — permission + station filtered; optional folder filter. */
export function deriveRecentFiles(
  nodes: ArchiveNodeLike[],
  actor: ArchiveActor | null | undefined,
  opts: { stationScope?: string | null; folderId?: string | null; limit?: number } = {},
) {
  const scoped = filterByStationScope(nodes, opts.stationScope);
  let files = scoped
    .filter((n) => n.type === "file")
    .map((f) => enrichFile(f, nodes, actor))
    .filter((f) => f.visible);

  if (opts.folderId) {
    files = files.filter(
      (f) => f.parentId === opts.folderId || isUnderFolder(nodes, f, opts.folderId!),
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

export function deriveArchiveStats(
  nodes: ArchiveNodeLike[],
  actor: ArchiveActor | null | undefined,
  opts: { stationScope?: string | null } = {},
) {
  const folders = deriveVisibleFolders(nodes, actor, {
    stationScope: opts.stationScope,
    parentId: null,
  });
  const files = deriveRecentFiles(nodes, actor, {
    stationScope: opts.stationScope,
    limit: 10_000,
  });
  const byAccess: Record<FileAccessScope, number> = {
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
