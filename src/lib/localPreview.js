import {
  activateCompanySession,
  getSession,
  setSession,
} from "@/lib/store";
import { appParams } from "@/lib/app-params";

export const LOCAL_PREVIEW_COMPANY_ID = "local-preview-nirovera";
export const LOCAL_PREVIEW_FLAG = "powercare_local_preview";

export function isBase44BackendConfigured() {
  return Boolean(appParams.appBaseUrl && String(appParams.appId || "").trim());
}

export function isLocalPreviewActive() {
  try {
    return localStorage.getItem(LOCAL_PREVIEW_FLAG) === "1";
  } catch {
    return false;
  }
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`;
}

/**
 * Seeds a rich local workspace and opens a director session
 * so /app works without Base44 cloud auth.
 */
export function enterLocalPreview() {
  const companyId = LOCAL_PREVIEW_COMPANY_ID;
  const stationNorth = "st_north_preview";
  const stationEast = "st_east_preview";
  const ownerId = "emp_owner_preview";
  const managerId = "emp_manager_preview";
  const employeeId = "emp_field_preview";
  const hseId = "emp_hse_preview";
  const now = new Date().toISOString();

  const regKey = "powercare_registry";
  let registry = { companies: [] };
  try {
    registry = JSON.parse(localStorage.getItem(regKey) || '{"companies":[]}');
    if (!registry.companies) registry.companies = [];
  } catch {
    registry = { companies: [] };
  }

  const meta = {
    id: companyId,
    name: "NiroVera Preview",
    ownerEmail: "preview@nirovera.local",
    plan: "enterprise",
    allowedEmailDomain: "",
    createdAt: now,
    subscriptionStart: now,
    subscriptionEnd: null,
    subscriptionExempt: true,
  };
  const idx = registry.companies.findIndex((c) => c.id === companyId);
  if (idx >= 0) registry.companies[idx] = { ...registry.companies[idx], ...meta };
  else registry.companies.push(meta);
  localStorage.setItem(regKey, JSON.stringify(registry));

  const data = {
    id: companyId,
    name: meta.name,
    plan: "enterprise",
    directorId: ownerId,
    ownerId,
    stations: [
      { id: stationNorth, name: "المحطة الشمالية", createdAt: now, managerId },
      { id: stationEast, name: "المحطة الشرقية", createdAt: now },
    ],
    employees: [
      {
        id: ownerId,
        name: "نيار عبدالله",
        email: "preview@nirovera.local",
        role: "director",
        stationId: null,
        phone: "0595414472",
        anonymousId: "a_owner",
        createdAt: now,
        leaveRequests: [],
        profile: { satisfactionScore: 92 },
      },
      {
        id: managerId,
        name: "أحمد السالم",
        email: "ahmed@nirovera.local",
        role: "station_manager",
        stationId: stationNorth,
        phone: "",
        anonymousId: "a_mgr",
        createdAt: now,
        managedStations: [stationNorth],
        leaveRequests: [{ id: "lv_1", status: "pending", type: "annual" }],
        profile: { satisfactionScore: 88 },
      },
      {
        id: employeeId,
        name: "عمر ناصر",
        email: "omar@nirovera.local",
        role: "employee",
        stationId: stationNorth,
        phone: "",
        anonymousId: "a_emp",
        createdAt: now,
        leaveRequests: [],
        profile: { satisfactionScore: 81 },
      },
      {
        id: hseId,
        name: "سارة حسن",
        email: "sara@nirovera.local",
        role: "safety_officer",
        stationId: stationEast,
        phone: "",
        anonymousId: "a_hse",
        createdAt: now,
        leaveRequests: [],
        profile: { satisfactionScore: 90 },
      },
    ],
    tasks: [
      {
        id: "tk_1",
        title: "فحص وصيانة مضخات الخط الثالث",
        status: "in_progress",
        stationId: stationNorth,
        assignedTo: employeeId,
        weight: 4,
        completed_tasks: 34,
        task_target: 50,
        createdAt: now,
        dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      },
      {
        id: "tk_2",
        title: "تحديث لوحات السلامة",
        status: "pending",
        stationId: stationEast,
        assignedTo: hseId,
        weight: 2,
        completed_tasks: 0,
        task_target: 1,
        createdAt: now,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        id: "tk_3",
        title: "قراءة العداد الشهرية",
        status: "completed",
        stationId: stationNorth,
        assignedTo: employeeId,
        weight: 1,
        completed_tasks: 1,
        task_target: 1,
        createdAt: now,
      },
    ],
    reports: [
      { id: "rp_1", title: "تقرير وردية صباحية", status: "pending", stationId: stationNorth, createdAt: now },
      { id: "rp_2", title: "تقرير سلامة أسبوعي", status: "approved", stationId: stationEast, createdAt: now },
    ],
    anonymousReports: [
      { id: "an_1", type: "suggestion", priority: "medium", status: "open", stationId: stationNorth, createdAt: now },
    ],
    publicReports: [],
    safety: [
      {
        id: "sf_1",
        stationId: stationNorth,
        level: "yellow",
        hazards: [{ id: "hz_1", title: "عمل على ارتفاع" }],
        incidentLog: [],
      },
    ],
    files: [{ id: "fl_1", name: "عقد عمل — نموذج.pdf", createdAt: now }],
    plans: [],
    notifications: [
      { id: "nt_1", userId: ownerId, title: "طلب إجازة بانتظار الاعتماد", read: false, createdAt: now },
    ],
    templates: [],
    targets: [],
    hrLevels: [],
    jobGrades: [],
    hrClusters: [],
    schedules: [],
    stationChatGroups: [],
    personalPlaces: [],
    personalAttendance: [],
    plannerItems: [],
    journalEntries: [],
    payrollRuns: [{ id: "pr_1", month: "2026-08", status: "ready", items: [], createdAt: now }],
    payroll: [{ id: "py_1", month: "2026-08" }],
    smartPositions: [],
    complaintEscalationChain: [],
    signatureRequests: [{ id: "sg_1", status: "pending", createdAt: now }],
    signedDocuments: [],
    expenses: [{ id: "ex_1", status: "pending", amount: 450, createdAt: now }],
    inventory: [{ id: "inv_1", name: "قفازات عازلة", qty: 24 }],
    inventoryItems: [{ id: "ivi_1", name: "قاطع 32A", qty: 3 }],
    messages: [{ id: "ms_1", text: "اكتمل الفحص", createdAt: now }],
    settings: { rateLimitDaily: 3, rateLimitWeekly: 10, rateLimitMonthly: 30 },
    reportBranding: {},
  };

  localStorage.setItem(`powercare_company_${companyId}`, JSON.stringify(data));
  localStorage.setItem(LOCAL_PREVIEW_FLAG, "1");

  // Prefer direct session write — avoids cloud email side-effects in ensureOwnerUser path.
  try {
    setSession({ companyId, userId: ownerId });
  } catch {
    localStorage.setItem("powercare_session", JSON.stringify({ companyId, userId: ownerId }));
  }

  // Keep activate as a soft fallback if session helpers change.
  try {
    if (!getSession()?.userId) activateCompanySession(meta);
  } catch {
    localStorage.setItem("powercare_session", JSON.stringify({ companyId, userId: ownerId }));
  }

  return { companyId, userId: ownerId };
}

export function exitLocalPreview() {
  try {
    localStorage.removeItem(LOCAL_PREVIEW_FLAG);
  } catch {
    // ignore
  }
}
