// PowerCare data layer — localStorage-based, multi-tenant with full company isolation.
// Registry tracks all companies; each company's data lives under its own key.
import { MANAGER_PERMISSIONS, ASSISTANT_PERMISSIONS, groupLevelsByOrder, buildHRLevels } from "./hrLevels";
import { base44 } from "@/api/base44Client";

const REGISTRY_KEY = "powercare_registry";
const COMPANY_PREFIX = "powercare_company_";
const SESSION_KEY = "powercare_session";

/* ----------------------------- helpers ----------------------------- */
function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  notify();
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
// The lowest-order HR manager assigned to handle this employee's station (falls
// back up through cluster/company tiers if no station-level manager is assigned).
function getStationHRManager(data, employeeId) {
  const emp = data.employees.find((e) => e.id === employeeId);
  if (!emp) return null;
  const groups = groupLevelsByOrder(data.hrLevels || []);
  for (const group of groups) {
    if (!group.manager) continue;
    const candidate = data.employees.find((e) => {
      if (e.hrLevelId !== group.manager.id) return false;
      if (group.scope === "station") return e.hrStationId === emp.stationId;
      if (group.scope === "cluster") {
        const cluster = (data.hrClusters || []).find((c) => (c.stationIds || []).includes(emp.stationId));
        return cluster ? e.hrClusterId === cluster.id : false;
      }
      return true;
    });
    if (candidate) return candidate;
  }
  return null;
}

function hashId(seed) {
  // simple non-reversible hash for anonymous ids
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return "ANON-" + Math.abs(h).toString(16).toUpperCase().padStart(8, "0");
}
// Rotating anonymous code for an employee — changes automatically every 30 days.
export function getAnonymousCode(employeeId, atDate = new Date()) {
  const period = Math.floor(atDate.getTime() / (86400000 * 30));
  return hashId(`${employeeId}_${period}`);
}

/* ----------------------------- pub/sub ----------------------------- */
const listeners = new Set();
function notify() {
  listeners.forEach((fn) => fn());
}
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/* ----------------------------- registry ----------------------------- */
export function getRegistry() {
  return read(REGISTRY_KEY, { companies: [] });
}
function saveRegistry(reg) {
  write(REGISTRY_KEY, reg);
}
export function listCompanies() {
  return getRegistry().companies;
}
export function createCompany({ name, ownerEmail, ownerPassword, plan = "Starter", allowedEmailDomain = "" }) {
  const reg = getRegistry();
  const id = uid("comp");
  const company = { id, name, ownerEmail, ownerPassword, plan, allowedEmailDomain: allowedEmailDomain.trim(), createdAt: new Date().toISOString() };
  reg.companies.push(company);
  saveRegistry(reg);
  // seed empty company workspace
  const data = emptyCompanyData(company);
  write(companyKey(id), data);
  return company;
}
export function deleteCompany(id) {
  const reg = getRegistry();
  reg.companies = reg.companies.filter((c) => c.id !== id);
  saveRegistry(reg);
  localStorage.removeItem(companyKey(id));
}
export function getCompanyMeta(id) {
  return getRegistry().companies.find((c) => c.id === id) || null;
}

// Owner/director-controlled restriction: only emails ending in this domain may be added
// as employees for the company (e.g. "@acwa.com"). Empty/null = no restriction.
export function setAllowedEmailDomain(companyId, domain) {
  const reg = getRegistry();
  const c = reg.companies.find((x) => x.id === companyId);
  if (c) c.allowedEmailDomain = (domain || "").trim();
  saveRegistry(reg);
}

function companyKey(id) {
  return `${COMPANY_PREFIX}${id}`;
}

function emptyCompanyData(meta) {
  return {
    id: meta.id,
    name: meta.name,
    plan: meta.plan,
    directorId: null,   // user id of Operations Director
    ownerId: null,     // user id owning the company account
    stations: [],
    employees: [],
    tasks: [],
    reports: [],
    anonymousReports: [],
    publicReports: [],
    safety: [],
    plans: [],
    notifications: [],
    templates: [],
    targets: [],
    hrLevels: [],
    schedules: [],
    stationChatGroups: [],
    settings: { rateLimitDaily: 3, rateLimitWeekly: 10, rateLimitMonthly: 30 },
  };
}

/* ----------------------------- company data ----------------------------- */
export function getCompanyData(id) {
  return read(companyKey(id), null);
}
function saveCompanyData(id, data) {
  write(companyKey(id), data);
  syncEmployeesToEntity(id, data.employees);
  syncStationsToEntity(id, data.stations);
}

/* ----------------------------- employee database (real, persisted) -----------------------------
   The localStorage company blob still caches everything (stations, tasks, HR levels, etc.) for
   instant synchronous reads, but employees are additionally persisted to the real Employee entity
   so the workforce data survives beyond this browser. `employeeId` on each record is the same
   stable id used everywhere else in the app (stations.managerId, tasks.assignedTo, session.userId...). */
const lastSyncedEmployeesJSON = {};
async function syncEmployeesToEntity(companyId, employees) {
  const json = JSON.stringify(employees || []);
  if (lastSyncedEmployeesJSON[companyId] === json) return;
  lastSyncedEmployeesJSON[companyId] = json;
  try {
    await base44.functions.invoke("companyDirectory", { action: "syncEmployees", companyId, employees: employees || [] });
  } catch {
    // best-effort background sync — the localStorage cache remains usable for the running session
  }
}

/* ----------------------------- station database (real, persisted) -----------------------------
   Same pattern as employees: the localStorage company blob still caches stations for instant
   synchronous reads, but stations are additionally persisted to the real Station entity so the
   station list survives beyond this browser. */
const lastSyncedStationsJSON = {};
async function syncStationsToEntity(companyId, stations) {
  const json = JSON.stringify(stations || []);
  if (lastSyncedStationsJSON[companyId] === json) return;
  lastSyncedStationsJSON[companyId] = json;
  try {
    await base44.functions.invoke("companyDirectory", { action: "syncStations", companyId, stations: stations || [] });
  } catch {
    // best-effort background sync — the localStorage cache remains usable for the running session
  }
}

// Fetches the authoritative, persisted station list for a company from the real database.
export async function hydrateStationsFromEntity(companyId) {
  try {
    const res = await base44.functions.invoke("companyDirectory", { action: "getStations", companyId });
    const records = res?.data?.stations || [];
    if (!records.length) return null;
    return records.map((r) => ({
      id: r.stationId,
      name: r.name,
      location: r.location,
      type: r.type,
      status: r.status,
      managerId: r.managerId,
      createdAt: r.created_date,
    }));
  } catch {
    return null;
  }
}

// Fetches the authoritative, persisted employee list for a company from the real database.
export async function hydrateEmployeesFromEntity(companyId) {
  try {
    const res = await base44.functions.invoke("companyDirectory", { action: "getEmployees", companyId });
    const records = res?.data?.employees || [];
    if (!records.length) return null;
    return records.map((r) => ({
      id: r.employeeId,
      name: r.name,
      email: r.email,
      role: r.role,
      stationId: r.stationId,
      phone: r.phone,
      position: r.position,
      anonymousId: r.anonymousId,
      points: r.points,
      hrLevelId: r.hrLevelId,
      hrStationId: r.hrStationId,
      hrClusterId: r.hrClusterId,
      canManageTeam: r.canManageTeam,
      managedStations: r.managedStations,
      profile: r.profile,
      certificates: r.certificates,
      leaveRequests: r.leaveRequests,
      hrMessages: r.hrMessages,
      createdAt: r.created_date,
    }));
  } catch {
    return null;
  }
}

/* ----------------------------- session ----------------------------- */
export function getSession() {
  return read(SESSION_KEY, null);
}
export function setSession(session) {
  write(SESSION_KEY, session);
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  notify();
}
export function companyLogin(email, password) {
  const reg = getRegistry();
  const company = reg.companies.find(
    (c) => c.ownerEmail.toLowerCase() === String(email).toLowerCase() && c.ownerPassword === password
  );
  if (!company) return null;
  const data = getCompanyData(company.id);
  // default logged-in user = director
  const director = data.employees.find((e) => e.role === "director") || null;
  setSession({ companyId: company.id, userId: director ? director.id : null });
  return company;
}
export function switchUser(userId) {
  const s = getSession();
  if (!s) return;
  setSession({ ...s, userId });
}

/* ----------------------------- seed demo ----------------------------- */
// Creates a brand-new demo company pre-populated with stations, employees, completed
// and in-progress tasks, reports, safety records, plans and more — for previewing the
// platform. Can be called anytime (not gated on an empty registry).
export function createDemoCompany() {
  const suffix = Math.random().toString(36).slice(2, 6);
  const company = createCompany({
    name: `Preview Company ${suffix.toUpperCase()}`,
    ownerEmail: `preview_${suffix}@powercare-demo.com`,
    ownerPassword: "demo123",
    plan: "Professional",
  });
  seedCompanyWithDemoData(company.id);
  return company;
}

function seedCompanyWithDemoData(companyId) {
  const data = getCompanyData(companyId);
  const company = { id: companyId };

  // stations
  const s1 = { id: uid("st"), name: "Station Alpha", location: "Riyadh North", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() };
  const s2 = { id: uid("st"), name: "Station Beta", location: "Dammam Coast", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() };
  const s3 = { id: uid("st"), name: "Station Gamma", location: "Jeddah Industrial", type: "Water", status: "maintenance", managerId: null, createdAt: new Date().toISOString() };
  data.stations = [s1, s2, s3];

  // employees
  const director = { id: uid("emp"), name: "Khalid Al-Otaibi", email: "khalid@gulfpower.com", role: "director", stationId: null, anonymousId: hashId(uid("a")), phone: "+96650000001", createdAt: new Date().toISOString() };
  const opsMgr = { id: uid("emp"), name: "Sara Al-Harbi", email: "sara@gulfpower.com", role: "ops_manager", stationId: null, anonymousId: hashId(uid("a")), phone: "+96650000002", createdAt: new Date().toISOString() };
  const pgm = { id: uid("emp"), name: "Faisal Al-Qahtani", email: "faisal@gulfpower.com", role: "pgm", stationId: null, managedStations: [s1.id, s2.id], canManageTeam: true, anonymousId: hashId(uid("a")), phone: "+96650000003", createdAt: new Date().toISOString() };
  const mgr1 = { id: uid("emp"), name: "Nora Al-Subaei", email: "nora@gulfpower.com", role: "station_manager", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000004", createdAt: new Date().toISOString() };
  const mgr2 = { id: uid("emp"), name: "Omar Al-Dossari", email: "omar@gulfpower.com", role: "station_manager", stationId: s2.id, anonymousId: hashId(uid("a")), phone: "+96650000005", createdAt: new Date().toISOString() };
  const e1 = { id: uid("emp"), name: "Ali Al-Mutairi", email: "ali@gulfpower.com", role: "employee", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000006", createdAt: new Date().toISOString() };
  const e2 = { id: uid("emp"), name: "Mona Al-Shehri", email: "mona@gulfpower.com", role: "employee", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000007", createdAt: new Date().toISOString() };
  const e3 = { id: uid("emp"), name: "Hassan Al-Ghamdi", email: "hassan@gulfpower.com", role: "employee", stationId: s2.id, anonymousId: hashId(uid("a")), phone: "+96650000008", createdAt: new Date().toISOString() };
  const e4 = { id: uid("emp"), name: "Layla Al-Zahrani", email: "layla@gulfpower.com", role: "employee", stationId: s3.id, anonymousId: hashId(uid("a")), phone: "+96650000009", createdAt: new Date().toISOString() };
  data.employees = [director, opsMgr, pgm, mgr1, mgr2, e1, e2, e3, e4];
  data.directorId = director.id;
  data.ownerId = director.id;
  s1.managerId = mgr1.id;
  s2.managerId = mgr2.id;

  // tasks
  const now = Date.now();
  data.tasks = [
    { id: uid("task"), title: "Monthly Generator Inspection", description: "Inspect all 12 generators, check oil levels and cooling.", stationId: s1.id, assignedTo: e1.id, status: "in_progress", dailyTarget: 50, progress: 32, stops: [], createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: uid("task"), title: "Cooling Tower Cleaning", description: "Deep clean cooling tower B.", stationId: s1.id, assignedTo: e2.id, status: "stopped", dailyTarget: 1, progress: 0, stops: [{ reason: "equipment_failure", note: "Pump #3 malfunction", at: new Date(now - 3600000).toISOString() }], createdAt: new Date(now - 86400000).toISOString() },
    { id: uid("task"), title: "Grid Connection Test", description: "Test synchronization with national grid.", stationId: s2.id, assignedTo: e3.id, status: "pending", dailyTarget: 5, progress: 0, stops: [], createdAt: new Date(now - 7200000).toISOString() },
    { id: uid("task"), title: "Water Quality Sampling", description: "Collect samples from 8 points.", stationId: s3.id, assignedTo: e4.id, status: "completed", dailyTarget: 8, progress: 8, stops: [], createdAt: new Date(now - 86400000 * 3).toISOString() },
  ];

  // reports
  data.reports = [
    { id: uid("rep"), title: "Shift A — Morning", content: "All systems nominal. Two minor alerts resolved.", stationId: s1.id, authorId: e1.id, status: "approved", createdAt: new Date(now - 86400000).toISOString() },
    { id: uid("rep"), title: "Shift B — Evening", content: "Generator 4 temperature slightly high, monitoring.", stationId: s1.id, authorId: e2.id, status: "pending", createdAt: new Date(now - 3600000 * 5).toISOString() },
    { id: uid("rep"), title: "Coastal Station Daily", content: "Salt spray cleaning completed on solar arrays.", stationId: s2.id, authorId: e3.id, status: "pending", createdAt: new Date(now - 7200000).toISOString() },
  ];

  // anonymous reports — station-scoped with escalation chain
  data.anonymousReports = [
    { id: uid("anr"), anonymousId: hashId("x1"), stationId: s1.id, type: "complaint", priority: "high", message: "Safety gear not replaced for 3 weeks.", status: "open", escalationLevel: 0, replies: [], createdAt: new Date(now - 86400000 * 2).toISOString() },
    { id: uid("anr"), anonymousId: hashId("x2"), stationId: s1.id, type: "suggestion", priority: "medium", message: "Suggest rotating night shifts more fairly.", status: "in_review", escalationLevel: 0, replies: [{ level: 0, role: "station_manager", authorName: "Nora Al-Subaei", text: "We are reviewing the shift schedule with HR.", createdAt: new Date(now - 86400000 * 3).toISOString() }], createdAt: new Date(now - 86400000 * 4).toISOString() },
    { id: uid("anr"), anonymousId: hashId("x3"), stationId: s2.id, type: "risk_report", priority: "high", message: "Exposed wiring near pump room.", status: "open", escalationLevel: 1, replies: [{ level: 0, role: "station_manager", authorName: "Omar Al-Dossari", text: "I inspected the area — forwarding to program management for maintenance budget approval.", createdAt: new Date(now - 86400000 * 2).toISOString() }], createdAt: new Date(now - 86400000).toISOString() },
  ];

  // safety
  data.safety = [
    { id: uid("safe"), stationId: s1.id, lastInspection: new Date(now - 86400000 * 10).toISOString(), incidents: 1, hazards: ["Wet floor near pump 2"], level: "amber" },
    { id: uid("safe"), stationId: s2.id, lastInspection: new Date(now - 86400000 * 5).toISOString(), incidents: 0, hazards: [], level: "green" },
    { id: uid("safe"), stationId: s3.id, lastInspection: new Date(now - 86400000 * 30).toISOString(), incidents: 2, hazards: ["Outdated fire extinguisher", "Blocked emergency exit"], level: "red" },
  ];

  // plans
  data.plans = [
    { id: uid("plan"), title: "Q3 Preventive Maintenance", stationId: s1.id, startDate: new Date(now + 86400000 * 7).toISOString(), endDate: new Date(now + 86400000 * 14).toISOString(), status: "scheduled", notes: "Full turbine service and grid relay testing." },
    { id: uid("plan"), title: "Desalination Filter Replacement", stationId: s3.id, startDate: new Date(now + 86400000 * 3).toISOString(), endDate: new Date(now + 86400000 * 5).toISOString(), status: "scheduled", notes: "Replace all primary filters." },
  ];

  // templates
  data.templates = [
    { id: uid("tpl"), title: "Monthly Preventive Maintenance", description: "Standard monthly maintenance routine.", dailyTarget: 50 },
    { id: uid("tpl"), title: "Daily Safety Walkthrough", description: "Walk all zones and log hazards.", dailyTarget: 1 },
  ];

  // task targets (manager-assigned quotas: X tasks in Y days)
  data.targets = [
    { id: uid("tgt"), assignedTo: e1.id, stationId: s1.id, totalTasks: 30, days: 10, completed: 12, createdBy: pgm.id, createdAt: new Date(now - 86400000 * 2).toISOString(), deadline: new Date(now + 86400000 * 8).toISOString(), status: "active" },
    { id: uid("tgt"), assignedTo: e3.id, stationId: s2.id, totalTasks: 20, days: 7, completed: 20, createdBy: opsMgr.id, createdAt: new Date(now - 86400000 * 7).toISOString(), deadline: new Date(now + 86400000 * 1).toISOString(), status: "completed" },
  ];

  // notifications
  data.notifications = [
    { id: uid("ntf"), userId: director.id, text: "New anonymous report filed (High priority).", read: false, createdAt: new Date(now - 3600000).toISOString() },
    { id: uid("ntf"), userId: director.id, text: "2 daily reports pending approval.", read: false, createdAt: new Date(now - 7200000).toISOString() },
    { id: uid("ntf"), userId: e1.id, text: "Task 'Monthly Generator Inspection' assigned to you.", read: true, createdAt: new Date(now - 86400000).toISOString() },
  ];

  saveCompanyData(company.id, data);
}

// Adds a full set of dummy stations, employees, tasks, reports, safety records, plans
// and notifications into an EXISTING company — without touching who's currently logged
// in (unlike createDemoCompany, this never replaces the employees/stations list).
export function seedDummyData(companyId) {
  updateCompany(companyId, (d) => {
    const s1 = { id: uid("st"), name: "Station Alpha", location: "Riyadh North", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() };
    const s2 = { id: uid("st"), name: "Station Beta", location: "Dammam Coast", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() };
    const s3 = { id: uid("st"), name: "Station Gamma", location: "Jeddah Industrial", type: "Water", status: "maintenance", managerId: null, createdAt: new Date().toISOString() };

    const mgr1 = { id: uid("emp"), name: "Nora Al-Subaei", email: "nora@example.com", role: "station_manager", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000104", createdAt: new Date().toISOString() };
    const mgr2 = { id: uid("emp"), name: "Omar Al-Dossari", email: "omar@example.com", role: "station_manager", stationId: s2.id, anonymousId: hashId(uid("a")), phone: "+96650000105", createdAt: new Date().toISOString() };
    const e1 = { id: uid("emp"), name: "Ali Al-Mutairi", email: "ali@example.com", role: "employee", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000106", createdAt: new Date().toISOString() };
    const e2 = { id: uid("emp"), name: "Mona Al-Shehri", email: "mona@example.com", role: "employee", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000107", createdAt: new Date().toISOString() };
    const e3 = { id: uid("emp"), name: "Hassan Al-Ghamdi", email: "hassan@example.com", role: "employee", stationId: s2.id, anonymousId: hashId(uid("a")), phone: "+96650000108", createdAt: new Date().toISOString() };
    const e4 = { id: uid("emp"), name: "Layla Al-Zahrani", email: "layla@example.com", role: "employee", stationId: s3.id, anonymousId: hashId(uid("a")), phone: "+96650000109", createdAt: new Date().toISOString() };

    s1.managerId = mgr1.id;
    s2.managerId = mgr2.id;
    d.stations.push(s1, s2, s3);
    d.employees.push(mgr1, mgr2, e1, e2, e3, e4);

    const now = Date.now();
    d.tasks.push(
      { id: uid("task"), title: "Monthly Generator Inspection", description: "Inspect all 12 generators, check oil levels and cooling.", stationId: s1.id, assignedTo: e1.id, status: "in_progress", dailyTarget: 50, progress: 32, stops: [], createdAt: new Date(now - 86400000 * 2).toISOString() },
      { id: uid("task"), title: "Cooling Tower Cleaning", description: "Deep clean cooling tower B.", stationId: s1.id, assignedTo: e2.id, status: "stopped", dailyTarget: 1, progress: 0, stops: [{ reason: "equipment_failure", note: "Pump #3 malfunction", at: new Date(now - 3600000).toISOString() }], createdAt: new Date(now - 86400000).toISOString() },
      { id: uid("task"), title: "Grid Connection Test", description: "Test synchronization with national grid.", stationId: s2.id, assignedTo: e3.id, status: "pending", dailyTarget: 5, progress: 0, stops: [], createdAt: new Date(now - 7200000).toISOString() },
      { id: uid("task"), title: "Water Quality Sampling", description: "Collect samples from 8 points.", stationId: s3.id, assignedTo: e4.id, status: "completed", dailyTarget: 8, progress: 8, stops: [], createdAt: new Date(now - 86400000 * 3).toISOString() }
    );

    d.reports.push(
      { id: uid("rep"), title: "Shift A — Morning", content: "All systems nominal. Two minor alerts resolved.", stationId: s1.id, authorId: e1.id, status: "approved", createdAt: new Date(now - 86400000).toISOString() },
      { id: uid("rep"), title: "Shift B — Evening", content: "Generator 4 temperature slightly high, monitoring.", stationId: s1.id, authorId: e2.id, status: "pending", createdAt: new Date(now - 3600000 * 5).toISOString() },
      { id: uid("rep"), title: "Coastal Station Daily", content: "Salt spray cleaning completed on solar arrays.", stationId: s2.id, authorId: e3.id, status: "pending", createdAt: new Date(now - 7200000).toISOString() }
    );

    d.anonymousReports.push(
      { id: uid("anr"), anonymousId: hashId("x1"), stationId: s1.id, type: "complaint", priority: "high", message: "Safety gear not replaced for 3 weeks.", status: "open", escalationLevel: 0, replies: [], createdAt: new Date(now - 86400000 * 2).toISOString() },
      { id: uid("anr"), anonymousId: hashId("x3"), stationId: s2.id, type: "risk_report", priority: "high", message: "Exposed wiring near pump room.", status: "open", escalationLevel: 1, replies: [], createdAt: new Date(now - 86400000).toISOString() }
    );

    d.safety.push(
      { id: uid("safe"), stationId: s1.id, lastInspection: new Date(now - 86400000 * 10).toISOString(), incidents: 1, hazards: ["Wet floor near pump 2"], level: "amber" },
      { id: uid("safe"), stationId: s2.id, lastInspection: new Date(now - 86400000 * 5).toISOString(), incidents: 0, hazards: [], level: "green" },
      { id: uid("safe"), stationId: s3.id, lastInspection: new Date(now - 86400000 * 30).toISOString(), incidents: 2, hazards: ["Outdated fire extinguisher", "Blocked emergency exit"], level: "red" }
    );

    d.plans.push(
      { id: uid("plan"), title: "Q3 Preventive Maintenance", stationId: s1.id, startDate: new Date(now + 86400000 * 7).toISOString(), endDate: new Date(now + 86400000 * 14).toISOString(), status: "scheduled", notes: "Full turbine service and grid relay testing." }
    );

    d.targets.push(
      { id: uid("tgt"), assignedTo: e1.id, stationId: s1.id, totalTasks: 30, days: 10, completed: 12, createdBy: mgr1.id, createdAt: new Date(now - 86400000 * 2).toISOString(), deadline: new Date(now + 86400000 * 8).toISOString(), status: "active" }
    );

    if (!d.directorId) d.directorId = d.employees[0]?.id || null;
    if (!d.ownerId) d.ownerId = d.directorId;
  });
}

// Seeds (or reuses) a full 5-tier HR hierarchy — station managers, a station cluster,
// Site/Cluster/Head-of-Ops/VP/CHRO HR positions — plus sample anonymous complaints sitting
// at different escalation levels (station manager → Site HR → Cluster HR → ... → CHRO),
// so the whole escalation chain can be inspected end-to-end. Safe to run on any existing company.
export function seedHRDemoHierarchy(companyId) {
  updateCompany(companyId, (d) => {
    if (d.stations.length < 2) {
      d.stations.push(
        { id: uid("st"), name: "Station Alpha", location: "Riyadh North", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() },
        { id: uid("st"), name: "Station Beta", location: "Dammam Coast", type: "Power", status: "active", managerId: null, createdAt: new Date().toISOString() }
      );
    }
    const [s1, s2] = d.stations;

    if (!d.hrLevels || d.hrLevels.length === 0) d.hrLevels = buildHRLevels();

    d.hrClusters = d.hrClusters || [];
    let cluster = d.hrClusters[0];
    if (!cluster) {
      cluster = { id: uid("clu"), name: "Northern Cluster", stationIds: [s1.id, s2.id] };
      d.hrClusters.push(cluster);
    }

    let mgr1 = d.employees.find((e) => e.role === "station_manager" && e.stationId === s1.id);
    if (!mgr1) {
      mgr1 = { id: uid("emp"), name: "Nora Al-Subaei", email: "nora.mgr@demo.com", role: "station_manager", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000201", createdAt: new Date().toISOString() };
      d.employees.push(mgr1);
      s1.managerId = mgr1.id;
    }
    let emp1 = d.employees.find((e) => e.role === "employee" && e.stationId === s1.id);
    if (!emp1) {
      emp1 = { id: uid("emp"), name: "Ali Al-Mutairi", email: "ali.demo@demo.com", role: "employee", stationId: s1.id, anonymousId: hashId(uid("a")), phone: "+96650000203", createdAt: new Date().toISOString() };
      d.employees.push(emp1);
    }

    const groups = groupLevelsByOrder(d.hrLevels);
    const [tier1, tier2, tier3, tier4, tier5] = groups; // station, cluster, then company-wide tiers

    const assign = (name, email, level, hrStationId, hrClusterId) => {
      if (!level) return null;
      let emp = d.employees.find((e) => e.hrLevelId === level.id && e.hrStationId === (hrStationId || null) && e.hrClusterId === (hrClusterId || null));
      if (!emp) {
        emp = { id: uid("emp"), name, email, role: "employee", stationId: null, anonymousId: hashId(uid("a")), phone: "", hrLevelId: level.id, hrStationId: hrStationId || null, hrClusterId: hrClusterId || null, createdAt: new Date().toISOString() };
        d.employees.push(emp);
      }
      return emp;
    };
    const siteHR = assign("Sami Al-Harbi", "sami.hr@demo.com", tier1?.manager, s1.id, null);
    const clusterHR = assign("Huda Al-Qahtani", "huda.hr@demo.com", tier2?.manager, null, cluster.id);
    assign("Faisal Al-Otaibi", "faisal.hr@demo.com", tier3?.manager, null, null);
    assign("Reem Al-Shammari", "reem.hr@demo.com", tier4?.manager, null, null);
    const chro = assign("Khalid Al-Rashidi", "khalid.chro@demo.com", tier5?.manager, null, null);

    const now = Date.now();
    d.anonymousReports = d.anonymousReports || [];
    d.anonymousReports.push(
      { id: uid("anr"), authorId: emp1.id, stationId: s1.id, type: "complaint", priority: "high", message: "[Demo] Safety gear hasn't been replaced for 3 weeks.", status: "open", escalationLevel: 0, replies: [], files: [], createdAt: new Date(now - 86400000).toISOString() },
      { id: uid("anr"), authorId: emp1.id, stationId: s1.id, type: "complaint", priority: "medium", message: "[Demo] Disagree with my station manager's decision on a leave request.", status: "open", escalationLevel: 1, replies: [
          { level: 0, role: "station_manager", authorName: mgr1.name, text: "Reviewed — forwarding to Site HR for a second opinion.", files: [], createdAt: new Date(now - 86400000 * 2).toISOString() },
        ], files: [], createdAt: new Date(now - 86400000 * 3).toISOString() },
      { id: uid("anr"), authorId: emp1.id, stationId: s2.id, type: "suggestion", priority: "low", message: "[Demo] Requesting a fairer night-shift rotation policy across the cluster.", status: "open", escalationLevel: 2, replies: [
          { level: 1, role: "employee", authorName: siteHR?.name || "Site HR", text: "Outside my authority for this station — escalating to Cluster HR.", files: [], createdAt: new Date(now - 86400000 * 4).toISOString() },
        ], files: [], createdAt: new Date(now - 86400000 * 6).toISOString() },
      { id: uid("anr"), authorId: emp1.id, stationId: s1.id, type: "complaint", priority: "high", message: "[Demo] Serious misconduct complaint — escalated all the way to the CHRO and resolved.", status: "closed", resolution: "approved", escalationLevel: 5, replies: [
          { level: 0, role: "station_manager", authorName: mgr1.name, text: "Escalating immediately given the severity.", files: [], createdAt: new Date(now - 86400000 * 10).toISOString() },
          { level: 2, role: "employee", authorName: clusterHR?.name || "Cluster HR", text: "Confirmed and escalated to company leadership.", files: [], createdAt: new Date(now - 86400000 * 9).toISOString() },
          { level: 5, role: "employee", authorName: chro?.name || "CHRO", text: "Investigated and resolved — corrective action taken.", files: [], createdAt: new Date(now - 86400000 * 8).toISOString() },
        ], files: [], createdAt: new Date(now - 86400000 * 12).toISOString() }
    );
  });
}

// Assigns one employee as Station Manager for one or more stations at once — promotes
// them to the station_manager role, clears their old single-station manager slot (if any),
// and sets station.managerId on every selected station so the escalation chain (level 0,
// see src/lib/escalation.js) and org chart both recognize them everywhere they manage.
export function assignStationManager(companyId, employeeId, stationIds) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    d.stations.forEach((s) => { if (s.managerId === emp.id) s.managerId = null; });
    const ids = Array.isArray(stationIds) ? stationIds.filter(Boolean) : [];
    emp.role = "station_manager";
    emp.stationId = ids.length === 1 ? ids[0] : null;
    emp.managedStations = ids;
    ids.forEach((sid) => {
      const s = d.stations.find((x) => x.id === sid);
      if (s) s.managerId = emp.id;
    });
  });
}

/* ----------------------------- mutations ----------------------------- */
export function updateCompany(companyId, updater) {
  const data = getCompanyData(companyId);
  if (!data) return;
  updater(data);
  saveCompanyData(companyId, data);
  return data;
}

export function addNotification(companyId, userId, text) {
  updateCompany(companyId, (d) => {
    d.notifications.unshift({ id: uid("ntf"), userId, text, read: false, createdAt: new Date().toISOString() });
  });
}

/* ----------------------------- employee profile (SAP-style) ----------------------------- */
// Professional info, certificates and salary live directly on the employee record.
export function updateEmployeeProfile(companyId, employeeId, profile) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.profile = { ...(emp.profile || {}), ...profile };
  });
}

// Manual presence status the employee sets for themself (online/away/busy/call).
export function setPresenceStatus(companyId, employeeId, status) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.presenceStatus = status;
  });
}

export function addCertificate(companyId, employeeId, cert) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.certificates = emp.certificates || [];
    emp.certificates.push({ id: uid("cert"), status: "pending", ...cert, createdAt: new Date().toISOString() });
  });
  // Route the new upload to the assigned HR manager for this employee's station, if any.
  const data = getCompanyData(companyId);
  const hrManager = getStationHRManager(data, employeeId);
  if (hrManager) {
    const emp = data.employees.find((e) => e.id === employeeId);
    addNotification(companyId, hrManager.id, `${emp?.name || ""} uploaded a new certificate for your approval.`);
  }
}

export function removeCertificate(companyId, employeeId, certId) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.certificates = (emp.certificates || []).filter((c) => c.id !== certId);
  });
}

// Qualification/certification approval workflow — manager approves or rejects a pending upload.
export function setCertificateStatus(companyId, employeeId, certId, status, reviewerName) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const cert = (emp.certificates || []).find((c) => c.id === certId);
    if (!cert) return;
    cert.status = status;
    cert.reviewedBy = reviewerName;
    cert.reviewedAt = new Date().toISOString();
  });
}

// Manager-adjustable total allowed days per leave category.
export function setLeaveTotal(companyId, employeeId, type, total) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.profile = emp.profile || {};
    emp.profile.leaveTotals = emp.profile.leaveTotals || {};
    emp.profile.leaveTotals[type] = Math.max(0, Number(total) || 0);
  });
}

// HR communications — per-employee thread routed to Station HR or HQ HR.
export function addHRMessage(companyId, employeeId, { from, target, text, files, senderName }) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.hrMessages = emp.hrMessages || [];
    emp.hrMessages.push({ id: uid("msg"), from, target, text, files: files || [], senderName, createdAt: new Date().toISOString() });
  });
}

// Leave requests: employee submits, an authorized manager/HR approves or rejects.
export function submitLeaveRequest(companyId, employeeId, { type, startDate, endDate, reason, files }) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.leaveRequests = emp.leaveRequests || [];
    const days = Math.max(1, Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1);
    emp.leaveRequests.unshift({
      id: uid("leave"),
      type, startDate, endDate, days, reason,
      files: files || [],
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  });
  // Route to the assigned HR manager for this employee's station, if any.
  const data = getCompanyData(companyId);
  const hrManager = getStationHRManager(data, employeeId);
  if (hrManager) {
    const emp = data.employees.find((e) => e.id === employeeId);
    addNotification(companyId, hrManager.id, `New ${type} leave request from ${emp?.name || ""} needs your review.`);
  }
}

export function setLeaveRequestStatus(companyId, employeeId, requestId, status, reviewerName) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    const req = (emp.leaveRequests || []).find((r) => r.id === requestId);
    if (!req) return;
    req.status = status;
    req.reviewedBy = reviewerName;
    req.reviewedAt = new Date().toISOString();
    if (status === "approved") {
      const approvalDate = new Date();
      req.approvedAt = approvalDate.toISOString();
      // Annual leave: the active vacation period always starts on the approval date,
      // using the number of days originally requested.
      if (req.type === "annual") {
        const activeEnd = new Date(approvalDate);
        activeEnd.setDate(activeEnd.getDate() + ((req.days || 1) - 1));
        req.activeStartDate = approvalDate.toISOString();
        req.activeEndDate = activeEnd.toISOString();
      }
    }
  });
}

export function addPoints(companyId, employeeId, points, reason) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.points = (emp.points || 0) + Number(points);
    d.notifications.unshift({
      id: uid("ntf"),
      userId: employeeId,
      text: `🏆 +${points} ${reason || ""}`.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    });
  });
}

/* ----------------------------- anonymous rate limit ----------------------------- */
export function getAnonUsage(companyId, employeeId, legacyAnonymousId) {
  const data = getCompanyData(companyId);
  const now = Date.now();
  const mine = (r) => (r.authorId ? r.authorId === employeeId : r.anonymousId === legacyAnonymousId);
  const day = data.anonymousReports.filter((r) => mine(r) && now - new Date(r.createdAt).getTime() < 86400000).length;
  const week = data.anonymousReports.filter((r) => mine(r) && now - new Date(r.createdAt).getTime() < 86400000 * 7).length;
  const month = data.anonymousReports.filter((r) => mine(r) && now - new Date(r.createdAt).getTime() < 86400000 * 30).length;
  return {
    day, week, month,
    dayLimit: data.settings.rateLimitDaily,
    weekLimit: data.settings.rateLimitWeekly,
    monthLimit: data.settings.rateLimitMonthly ?? 30,
  };
}

// Director-only: configure how many anonymous complaints an employee may file per day/week/month.
export function setAnonRateLimits(companyId, { daily, weekly, monthly } = {}) {
  updateCompany(companyId, (d) => {
    d.settings = d.settings || {};
    if (daily != null) d.settings.rateLimitDaily = Number(daily);
    if (weekly != null) d.settings.rateLimitWeekly = Number(weekly);
    if (monthly != null) d.settings.rateLimitMonthly = Number(monthly);
  });
}

/* ----------------------------- station work schedules (shift-type grid) -----------------------------
   Each station has a fixed set of shift types (e.g. Morning/Evening/Night) with editable
   names & time ranges, shared across every day of the week. `assignments[weekday][shiftTypeId]`
   holds the list of employeeIds working that shift on that day. weekday: 0 = Sunday ... 6 = Saturday */
function defaultShiftTypes() {
  return [
    { id: uid("sft"), label: "Morning Shift", start: "06:00", end: "14:00" },
    { id: uid("sft"), label: "Evening Shift", start: "14:00", end: "22:00" },
    { id: uid("sft"), label: "Night Shift", start: "22:00", end: "06:00" },
  ];
}

function getOrCreateSchedule(d, stationId) {
  d.schedules = d.schedules || [];
  let entry = d.schedules.find((s) => s.stationId === stationId);
  if (!entry) {
    entry = { id: uid("sch"), stationId, shiftTypes: defaultShiftTypes(), assignments: {} };
    d.schedules.push(entry);
  }
  if (!entry.shiftTypes || entry.shiftTypes.length === 0) entry.shiftTypes = defaultShiftTypes();
  entry.assignments = entry.assignments || {};
  return entry;
}

export function addShiftType(companyId, stationId, shiftType) {
  updateCompany(companyId, (d) => {
    const entry = getOrCreateSchedule(d, stationId);
    entry.shiftTypes.push({ id: uid("sft"), label: shiftType.label, start: shiftType.start, end: shiftType.end });
  });
}

export function updateShiftType(companyId, stationId, shiftTypeId, updates) {
  updateCompany(companyId, (d) => {
    const entry = getOrCreateSchedule(d, stationId);
    const st = entry.shiftTypes.find((s) => s.id === shiftTypeId);
    if (st) Object.assign(st, updates);
  });
}

export function removeShiftType(companyId, stationId, shiftTypeId) {
  updateCompany(companyId, (d) => {
    const entry = getOrCreateSchedule(d, stationId);
    entry.shiftTypes = entry.shiftTypes.filter((s) => s.id !== shiftTypeId);
    Object.values(entry.assignments).forEach((dayObj) => { delete dayObj[shiftTypeId]; });
  });
}

export function assignEmployeeToShift(companyId, stationId, weekday, shiftTypeId, employeeId) {
  updateCompany(companyId, (d) => {
    const entry = getOrCreateSchedule(d, stationId);
    entry.assignments[weekday] = entry.assignments[weekday] || {};
    entry.assignments[weekday][shiftTypeId] = entry.assignments[weekday][shiftTypeId] || [];
    if (!entry.assignments[weekday][shiftTypeId].includes(employeeId)) {
      entry.assignments[weekday][shiftTypeId].push(employeeId);
    }
  });
}

export function unassignEmployeeFromShift(companyId, stationId, weekday, shiftTypeId, employeeId) {
  updateCompany(companyId, (d) => {
    const entry = getOrCreateSchedule(d, stationId);
    if (!entry.assignments[weekday]?.[shiftTypeId]) return;
    entry.assignments[weekday][shiftTypeId] = entry.assignments[weekday][shiftTypeId].filter((id) => id !== employeeId);
  });
}

/* ----------------------------- station chat groups (flexible cross-station chat) -----------------------------
   Lets an owner link two or more stations (or HQ) into their own shared chat room, and create
   as many independent groups as needed (e.g. Station A+B together, Station C+D together). */
export function addStationChatGroup(companyId, { name, stationIds }) {
  updateCompany(companyId, (d) => {
    d.stationChatGroups = d.stationChatGroups || [];
    d.stationChatGroups.push({ id: uid("chgrp"), name, stationIds: stationIds || [] });
  });
}

export function removeStationChatGroup(companyId, groupId) {
  updateCompany(companyId, (d) => {
    d.stationChatGroups = (d.stationChatGroups || []).filter((g) => g.id !== groupId);
  });
}

/* ----------------------------- flexible HR hierarchy editor ----------------------------- */
// Any company can add, rename, reorder, or remove HR positions — the hierarchy is
// no longer fixed. Each level keeps its own `order` (escalation rank) and `scope`.
// stationIds (only meaningful when scope === "station"): leave empty/null so the position
// applies to every station, or pick one or more so the position — and any later suspend/
// remove/edit on it — only shows in the org chart of those chosen stations.
export function addHRTier(companyId, { scope, managerName, includeAssistant, assistantName, managerPermissions, assistantPermissions, stationIds }) {
  updateCompany(companyId, (d) => {
    d.hrLevels = d.hrLevels || [];
    const order = Math.max(0, ...d.hrLevels.map((l) => l.order || 0)) + 1;
    const sIds = Array.isArray(stationIds) && stationIds.length > 0 ? stationIds : null;
    d.hrLevels.push({ id: uid("hrlvl"), order, role: "manager", scope, stationIds: sIds, name: managerName, permissions: managerPermissions || MANAGER_PERMISSIONS, maxCount: null });
    if (includeAssistant) {
      d.hrLevels.push({ id: uid("hrlvl"), order, role: "assistant", scope, stationIds: sIds, name: assistantName || managerName, permissions: assistantPermissions || ASSISTANT_PERMISSIONS, maxCount: null });
    }
  });
}

export function renameHRLevel(companyId, levelId, name) {
  updateCompany(companyId, (d) => {
    const level = (d.hrLevels || []).find((l) => l.id === levelId);
    if (level) level.name = name;
  });
}

// Lets a company freely customize exactly which permissions any HR level (manager
// or assistant) holds — no fixed permission set per role.
export function setHRLevelPermissions(companyId, levelId, permissions) {
  updateCompany(companyId, (d) => {
    const level = (d.hrLevels || []).find((l) => l.id === levelId);
    if (level) level.permissions = permissions;
  });
}

// Updates which stations a station-scoped tier applies to (empty/null = all stations).
export function setHRTierStations(companyId, order, stationIds) {
  updateCompany(companyId, (d) => {
    const levels = (d.hrLevels || []).filter((l) => l.order === order);
    if (!levels.length) return;
    const sIds = Array.isArray(stationIds) && stationIds.length > 0 ? stationIds : null;
    levels.forEach((l) => { l.stationIds = sIds; });
  });
}

// Removes an entire position tier (manager + assistant sharing that order) and
// unassigns any employees who held those positions. Any anonymous report currently
// awaiting a reply from the removed tier is automatically redirected to whoever is
// above it in the chain (escalationLevel numbering naturally shifts up).
export function removeHRTier(companyId, order) {
  updateCompany(companyId, (d) => {
    const orders = Array.from(new Set((d.hrLevels || []).map((l) => l.order))).sort((a, b) => a - b);
    const removedPosition = orders.indexOf(order) + 1; // escalationLevel: 0 = station manager, 1..N = tiers in order
    const removedIds = (d.hrLevels || []).filter((l) => l.order === order).map((l) => l.id);
    d.hrLevels = (d.hrLevels || []).filter((l) => l.order !== order);
    d.employees.forEach((e) => {
      if (removedIds.includes(e.hrLevelId)) { e.hrLevelId = null; e.hrStationId = null; e.hrClusterId = null; }
    });
    if (removedPosition > 0) {
      (d.anonymousReports || []).forEach((r) => {
        if ((r.escalationLevel || 0) > removedPosition) r.escalationLevel -= 1;
        // reports exactly at the removed level stay at the same number, which now
        // naturally maps to the next-higher tier that shifted into that slot.
      });
    }
  });
}

// Suspends (or reactivates) a whole tier without deleting it — assigned employees and
// history stay intact, but the tier is hidden from org charts/assignment until re-enabled.
export function toggleHRTierActive(companyId, order) {
  updateCompany(companyId, (d) => {
    const levels = (d.hrLevels || []).filter((l) => l.order === order);
    if (!levels.length) return;
    const nextActive = levels.some((l) => l.active === false);
    levels.forEach((l) => { l.active = nextActive; });
  });
}

// Swaps a tier's order with the adjacent one — direction 1 = increase authority, -1 = decrease.
export function moveHRTier(companyId, order, direction) {
  updateCompany(companyId, (d) => {
    const orders = Array.from(new Set((d.hrLevels || []).map((l) => l.order))).sort((a, b) => a - b);
    const idx = orders.indexOf(order);
    const swapIdx = idx + direction;
    if (idx === -1 || swapIdx < 0 || swapIdx >= orders.length) return;
    const swapOrder = orders[swapIdx];
    (d.hrLevels || []).forEach((l) => {
      if (l.order === order) l.order = swapOrder;
      else if (l.order === swapOrder) l.order = order;
    });
  });
}