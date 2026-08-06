// «الدليل قبل الحكم» — الرؤية بالرفض الافتراضي.
// كل فئة بيانات مشتركة يجب أن تُعلن مَن يراها، ويُفلتَر المحتوى خادمياً قبل الإرجاع
// حتى لا ينزّل موظف عادي بيانات زملائه (إشعاراتهم، مذكراتهم، بلاغاتهم).

// self     = سجلات المستدعي فقط
// scope    = محطات المستدعي (أو المسند إليه)
// handlers = سلسلة معالجة البلاغات فقط (senior / manage_complaints)، ويرى المُبلِّغ بلاغاته
// payroll  = senior أو manage_payroll
// senior   = الإدارة العليا فقط
// shared   = بيانات تشغيلية مشتركة (محطات، إعدادات، هيكل) — مرئية للجميع
export const BLOB_VISIBILITY = {
  notifications: "self",
  journalEntries: "self",
  personalAttendance: "self",
  personalPlaces: "self",
  plannerItems: "self",
  anonymousReports: "handlers",
  publicReports: "handlers",
  reports: "scope",
  tasks: "scope",
  targets: "scope",
  plans: "scope",
  schedules: "scope",
  safety: "scope",
  files: "scope",
  payrollRuns: "payroll",
  hrLevels: "senior",
  hrClusters: "senior",
  jobGrades: "shared",
  companyMeta: "shared",
  orgTree: "shared",
  smartPositions: "shared",
  templates: "shared",
  complaintEscalationChain: "shared",
  attendancePolicy: "shared",
  attendanceEmergency: "shared",
};

// الحقول الحساسة في سجل الموظف — لا تُرسل إلا لصاحبها أو لمن يدير الموظفين.
export const SENSITIVE_EMPLOYEE_FIELDS = ["hrMessages", "leaveRequests", "certificates", "profile", "phone", "email"];

export function redactEmployee(record) {
  const safe = { ...record };
  for (const field of SENSITIVE_EMPLOYEE_FIELDS) delete safe[field];
  return safe;
}

const recordOwner = (item) => item.userId || item.employeeId || item.ownerId || item.createdBy || null;
const recordStation = (item) => item.stationId || item.station_id || null;

// يفلتر سجلات الـ blob وفق قاعدة الرؤية وسياق المستدعي.
export function filterBlobPayload(category, payload, context) {
  const rows = Array.isArray(payload) ? payload : [];
  const rule = BLOB_VISIBILITY[category];
  if (context.senior) return rows;
  if (rule === "shared") return rows;
  if (rule === undefined) return [];               // فئة غير معلنة = لا تُقرأ
  if (rule === "senior") return [];
  if (rule === "payroll") return context.permissions.has("manage_payroll") ? rows : [];
  if (rule === "self") return rows.filter((item) => recordOwner(item) === context.userId);
  if (rule === "handlers") {
    if (context.permissions.has("manage_complaints") || context.isComplaintHandler) return rows;
    return rows.filter((item) => context.ownReportIds.has(item.id));
  }
  // scope: محطات المستدعي، أو ما أُسند إليه شخصياً، أو ما أنشأه
  const stations = context.scope === null ? null : new Set(context.scope || []);
  return rows.filter((item) => {
    if (recordOwner(item) === context.userId) return true;
    if ((item.assignedTo || item.employeeId) === context.userId) return true;
    const station = recordStation(item);
    if (!station) return false;
    return stations === null ? true : stations.has(station);
  });
}

// الفئات التي لا يجوز حذف سجلاتها — الدليل لا يُمحى، يُؤرشَف بسبب.
export const APPEND_ONLY_CATEGORIES = ["anonymousReports", "publicReports", "reports", "safety"];

// يدمج اللقطة الواردة مع الموجود: التعديل مسموح، والحذف يُستبدل بأرشفة معلَّلة.
export function mergeAppendOnly(existingRows, incomingRows, actorName) {
  const incoming = Array.isArray(incomingRows) ? incomingRows : [];
  const incomingIds = new Set(incoming.map((item) => item.id).filter(Boolean));
  const preserved = (Array.isArray(existingRows) ? existingRows : [])
    .filter((item) => item.id && !incomingIds.has(item.id))
    .map((item) => ({
      ...item,
      status: "archived",
      archivedBy: item.archivedBy || actorName || "unknown",
      archivedAt: item.archivedAt || new Date().toISOString(),
      archivedReason: item.archivedReason || "removed_by_client_sync",
    }));
  return { payload: [...incoming, ...preserved], archived: preserved.length };
}