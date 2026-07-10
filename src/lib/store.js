// PowerCare data layer — localStorage-based, multi-tenant with full company isolation.
// Registry tracks all companies; each company's data lives under its own key.
import { MANAGER_PERMISSIONS, ASSISTANT_PERMISSIONS, groupLevelsByOrder } from "./hrLevels";

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
    hrLevels: [],
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

/* ----------------------------- employee profile (SAP-style) ----------------------------- */
// Professional info, certificates and salary live directly on the employee record.
export function updateEmployeeProfile(companyId, employeeId, profile) {
  updateCompany(companyId, (d) => {
    const emp = d.employees.find((e) => e.id === employeeId);
    if (!emp) return;
    emp.profile = { ...(emp.profile || {}), ...profile };
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

/* ----------------------------- flexible HR hierarchy editor ----------------------------- */
// Any company can add, rename, reorder, or remove HR positions — the hierarchy is
// no longer fixed. Each level keeps its own `order` (escalation rank) and `scope`.
export function addHRTier(companyId, { scope, managerName, includeAssistant, assistantName }) {
  updateCompany(companyId, (d) => {
    d.hrLevels = d.hrLevels || [];
    const order = Math.max(0, ...d.hrLevels.map((l) => l.order || 0)) + 1;
    d.hrLevels.push({ id: uid("hrlvl"), order, role: "manager", scope, name: managerName, permissions: MANAGER_PERMISSIONS, maxCount: null });
    if (includeAssistant) {
      d.hrLevels.push({ id: uid("hrlvl"), order, role: "assistant", scope, name: assistantName || managerName, permissions: ASSISTANT_PERMISSIONS, maxCount: null });
    }
  });
}

export function renameHRLevel(companyId, levelId, name) {
  updateCompany(companyId, (d) => {
    const level = (d.hrLevels || []).find((l) => l.id === levelId);
    if (level) level.name = name;
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