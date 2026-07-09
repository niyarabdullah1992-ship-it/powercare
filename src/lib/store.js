// PowerCare data layer — localStorage-based, multi-tenant with full company isolation.
// Registry tracks all companies; each company's data lives under its own key.

const REGISTRY_KEY = "powercare_registry";
const COMPANY_PREFIX = "powercare_company_";
const OWNER_KEY = "powercare_owner";
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

/* ----------------------------- owner ----------------------------- */
export function getOwner() {
  return read(OWNER_KEY, null);
}
export function setOwner(password) {
  write(OWNER_KEY, { password });
}
export function ownerLogin(password) {
  const owner = getOwner();
  if (!owner) return false;
  return owner.password === password;
}
export function ownerExists() {
  return !!getOwner();
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
export function createCompany({ name, ownerEmail, ownerPassword, plan = "Starter" }) {
  const reg = getRegistry();
  const id = uid("comp");
  const company = { id, name, ownerEmail, ownerPassword, plan, createdAt: new Date().toISOString() };
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
    safety: [],
    plans: [],
    notifications: [],
    templates: [],
    targets: [],
    settings: { rateLimitDaily: 3, rateLimitWeekly: 10, rateLimitMonthly: 30 },
  };
}

/* ----------------------------- company data ----------------------------- */
export function getCompanyData(id) {
  return read(companyKey(id), null);
}
function saveCompanyData(id, data) {
  write(companyKey(id), data);
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
export function seedDemoIfEmpty() {
  if (getRegistry().companies.length > 0) return;
  // owner password
  if (!getOwner()) setOwner("owner123");
  // create demo company
  const company = createCompany({
    name: "Gulf Power Operations",
    ownerEmail: "admin@gulfpower.com",
    ownerPassword: "demo123",
    plan: "Professional",
  });
  const data = getCompanyData(company.id);

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