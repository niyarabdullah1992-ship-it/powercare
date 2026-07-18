import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification, updateEmployeeProfile, setAllowedEmailDomain, deleteEmployeeAccount } from "@/lib/store";
import { canManageEmployees, isCompanyOwner, canManageStations, visibleStations, visibleEmployees } from "@/lib/permissions";
import { canAddEmployee } from "@/lib/planLimits";
import { Link } from "react-router-dom";
import { Plus, Trash2, Search, ArrowLeft, AlertTriangle, KeyRound, UserCog, Pencil, Check, X, Briefcase, UserCircle, Mail, GripVertical, Users } from "lucide-react";
import { badgeFor, nextBadge } from "@/lib/rewards";
import { getRoleLabel } from "@/lib/roles";
import { base44 } from "@/api/base44Client";
import RoleLabelsEditor from "@/components/employees/RoleLabelsEditor";
import RolesGuide from "@/components/employees/RolesGuide";
import EmployeePoints from "@/components/employees/EmployeePoints";
import EmployeePerformance from "@/components/employees/EmployeePerformance";
import EmployeeAccessGuide from "@/components/employees/EmployeeAccessGuide";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import AuditLogPanel from "@/components/audit/AuditLogPanel";
import StationCombobox from "@/components/stations/StationCombobox";
import { logAudit } from "@/lib/auditLog";
import PageHeader from "@/components/PageHeader";
import MobileSelect from "@/components/mobile/MobileSelect";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

const ROLES = ["employee", "inventory_keeper", "station_manager", "pgm", "ops_manager", "director"];

const TASK_STATUS_STYLES = {
  overdue: "border-red-300 bg-red-50 text-red-700",
  inProgress: "border-amber-300 bg-amber-50 text-amber-700",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  noTasks: "border-border bg-muted text-muted-foreground",
};
const TASK_STATUS_DOT = {
  overdue: "bg-red-500",
  inProgress: "bg-amber-500",
  completed: "bg-emerald-500",
  noTasks: "bg-muted-foreground/40",
};

export default function Employees() {
  const { t } = useI18n();
  const { data, currentUser, company, switchUser } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "employee", stationId: "" });
  const [pgmStations, setPgmStations] = useState([]);
  const [editingTitle, setEditingTitle] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showTransfer, setShowTransfer] = useState(null);
  const [targets, setTargets] = useState([]);
  const [editingDomain, setEditingDomain] = useState(false);
  const [domainInput, setDomainInput] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (!currentUser) return;
    let ignore = false;
    base44.functions.invoke("supabaseTargets", {
      action: "listTargets",
      userRole: currentUser.role,
      userId: currentUser.id,
      stationId: currentUser.stationId || null,
      managedStations: currentUser.managedStations || [],
    }).then((res) => { if (!ignore) setTargets(res?.data?.targets || []); }).catch(() => {});
    return () => { ignore = true; };
  }, [currentUser?.id]);

  const taskStatusFor = (empId) => {
    const mine = targets.filter((tg) => tg.assignment_type === "member" && tg.employee_id === empId);
    if (mine.some((tg) => tg.status === "overdue")) return "overdue";
    if (mine.some((tg) => tg.status === "active")) return "inProgress";
    if (mine.length > 0) return "completed";
    return "noTasks";
  };

  if (!data || !currentUser) return null;
  const canManage = canManageEmployees(currentUser);
  const canTransfer = isCompanyOwner(currentUser, data);
  const canDeleteAccounts = canTransfer || !!currentUser.hrLevelId;
  const stations = visibleStations(currentUser, data);
  const defaultStationId = data.stations?.[0]?.id || null;
  // Station managers can only add employees / station managers to their own station
  const allowedRoles = currentUser.role === "station_manager" ? ["employee", "inventory_keeper", "station_manager"] : ROLES;

  const saveDomain = () => {
    setAllowedEmailDomain(company.id, domainInput);
    setEditingDomain(false);
  };

  // Drag-and-drop reordering of the station cards (reorders the underlying station list).
  const canReorderStations = canManageStations(currentUser, data);
  const handleStationDragEnd = (result) => {
    if (!result.destination || !canReorderStations) return;
    const ids = stations.map((s) => s.id);
    const reordered = Array.from(ids);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateCompany(company.id, (d) => {
      const byId = Object.fromEntries(d.stations.map((s) => [s.id, s]));
      const positions = [];
      d.stations.forEach((s, i) => { if (ids.includes(s.id)) positions.push(i); });
      const next = [...d.stations];
      positions.forEach((pos, idx) => { next[pos] = byId[reordered[idx]]; });
      d.stations = next;
    });
  };

  // Drill-down: show station grid first
  if (!selectedStation) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("employees")} description={`${visibleEmployees(currentUser, data).length} ${t("employees").toLowerCase()}`} icon={Users} />

        <RolesGuide company={company} />

        {(canTransfer || currentUser.role === "director") && (
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex flex-wrap gap-2">
              {currentUser.role === "director" && (
                <button onClick={() => setShowTransfer("director")} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                  <UserCog className="w-3.5 h-3.5" /> {t("transferDirector")}
                </button>
              )}
              {canTransfer && (
                <button onClick={() => setShowTransfer("ownership")} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                  <KeyRound className="w-3.5 h-3.5" /> {t("transferOwnership")}
                </button>
              )}
              {currentUser.role === "director" && <RoleLabelsEditor company={company} />}
            </div>
            {canTransfer && <div className="mt-3"><AuditLogPanel companyId={company.id} /></div>}
            {currentUser.role === "director" && (
              <div className="mt-3 pt-3 border-t border-border">
                {editingDomain ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      autoFocus
                      value={domainInput}
                      onChange={(e) => setDomainInput(e.target.value)}
                      placeholder="@acwa.com"
                      className="px-2.5 py-1.5 rounded-md border border-input text-xs font-body"
                    />
                    <button onClick={saveDomain} className="p-1.5 rounded-md hover:bg-accent/10 text-accent"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingDomain(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingDomain(true); setDomainInput(company.allowedEmailDomain || ""); }}
                    className="flex items-center gap-2 text-xs font-body text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {t("allowedEmailDomain")}: {company.allowedEmailDomain ? <span className="text-foreground">{company.allowedEmailDomain}</span> : t("all")}
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
                <p className="text-[11px] text-muted-foreground font-body mt-1">{t("allowedEmailDomainNote")}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <DragDropContext onDragEnd={handleStationDragEnd}>
            <Droppable droppableId="employees-station-cards">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="contents">
                  {stations.map((s, index) => {
                    const team = data.employees.filter((e) => (e.stationId || defaultStationId) === s.id || (["pgm", "station_manager"].includes(e.role) && (e.managedStations || []).includes(s.id)));
                    const hasManager = team.some((e) => e.role === "station_manager");
                    const counts = ROLES.reduce((acc, r) => ({ ...acc, [r]: team.filter((e) => e.role === r).length }), {});
                    return (
                      <Draggable key={s.id} draggableId={s.id} index={index} isDragDisabled={!canReorderStations}>
                        {(dragProvided, dragSnapshot) => (
                          <button
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            onClick={() => setSelectedStation(s.id)}
                            className={`text-start p-5 rounded-xl border border-border bg-card hover:border-accent transition-colors space-y-3 ${dragSnapshot.isDragging ? "shadow-lg ring-2 ring-accent/40" : ""}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {canReorderStations && (
                                  <span {...dragProvided.dragHandleProps} onClick={(e) => e.stopPropagation()} className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                )}
                                <h3 className="font-heading font-semibold">{s.name}</h3>
                              </div>
                              {!hasManager && (
                                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-body">
                                  <AlertTriangle className="w-3 h-3" /> {t("noManager")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground font-body">{team.length} {t("team").toLowerCase()}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {ROLES.filter((r) => counts[r] > 0).map((r) => (
                                <span key={r} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-body text-muted-foreground">
                                  {counts[r]} {getRoleLabel(company, r, t)}
                                </span>
                              ))}
                            </div>
                          </button>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {showTransfer && <TransferModal type={showTransfer} onClose={() => setShowTransfer(null)} />}
      </div>
    );
  }

  // Station team view — unassigned employees follow the first available station.
  const station = data.stations.find((s) => s.id === selectedStation);
  let team = data.employees.filter((e) => (e.stationId || defaultStationId) === selectedStation || (["pgm", "station_manager"].includes(e.role) && (e.managedStations || []).includes(selectedStation)));
  if (search) team = team.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()));
  if (roleFilter !== "all") team = team.filter((e) => e.role === roleFilter);

  const employeeLimitReached = !canAddEmployee(company, data);

  const addEmployee = (e) => {
    e.preventDefault();
    if (employeeLimitReached) return;
    setEmailError("");
    const domain = (company.allowedEmailDomain || "").trim().toLowerCase();
    if (domain && !form.email.toLowerCase().endsWith(domain)) {
      setEmailError(t("invalidEmailDomain"));
      return;
    }
    updateCompany(company.id, (d) => {
      const emp = {
        id: "emp_" + Math.random().toString(36).slice(2, 9),
        name: form.name,
        email: form.email,
        role: form.role,
        stationId: selectedStation,
        anonymousId: "ANON-" + Math.abs(Math.random().toString(36).hashCode?.() || Math.floor(Math.random() * 1e8)).toString(16).toUpperCase().padStart(8, "0"),
        phone: "",
        createdAt: new Date().toISOString(),
      };
      if (form.role === "pgm") {
        // PGM is not tied to a single station — it's responsible for the stations assigned by the higher position
        emp.stationId = null;
        emp.managedStations = pgmStations;
      }
      d.employees.push(emp);
      if (form.role === "station_manager") {
        const s = d.stations.find((x) => x.id === selectedStation);
        if (s) s.managerId = emp.id;
      }
    });
    setShowAdd(false);
    setForm({ name: "", email: "", role: "employee", stationId: "" });
    setPgmStations([]);
  };

  const removeEmployee = async (id) => {
    await deleteEmployeeAccount(company.id, id);
  };

  const moveEmployee = (id, newStationId) => {
    updateCompany(company.id, (d) => {
      const emp = d.employees.find((x) => x.id === id);
      if (!emp) return;
      const oldStation = d.stations.find((s) => s.managerId === id);
      if (oldStation) oldStation.managerId = null;
      emp.stationId = newStationId || null;
    });
  };

  const saveTitle = (id) => {
    updateEmployeeProfile(company.id, id, { position: titleInput.trim() || "" });
    setEditingTitle(null);
    setTitleInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedStation(null)} className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl font-semibold">{station?.name}</h1>
          <p className="text-muted-foreground font-body text-sm">{t("team")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="w-full ps-9 pe-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>
        <MobileSelect
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder={t("all")}
          className="min-w-40"
          options={[{ value: "all", label: t("all") }, ...ROLES.map((role) => ({ value: role, label: getRoleLabel(company, role, t) }))]}
        />
        {canManage && (
          <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Plus className="w-4 h-4" /> {t("addEmployee")}
          </button>
        )}
      </div>

      {canManage && employeeLimitReached && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-body">{t("employeeLimitReached")}</p>
          <Link to="/pricing" className="px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body hover:bg-accent">{t("upgradePlan")}</Link>
        </div>
      )}

      {showAdd && !employeeLimitReached && (
        <form onSubmit={addEmployee} className="p-5 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
          <EmployeeAccessGuide t={t} />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("title")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <div>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("email")} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            {emailError && <p className="text-xs text-destructive font-body mt-1">{emailError}</p>}
          </div>
          <MobileSelect
            value={form.role}
            onChange={(role) => setForm({ ...form, role })}
            placeholder={t("role")}
            options={allowedRoles.map((role) => ({ value: role, label: getRoleLabel(company, role, t) }))}
          />
          {form.role === "pgm" && (
            <div className="md:col-span-3 p-3 rounded-md border border-border bg-background space-y-2">
              <p className="text-xs text-muted-foreground font-body">{t("selectStation")}</p>
              <div className="flex flex-wrap gap-2">
                {data.stations.map((s) => (
                  <label key={s.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-body cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pgmStations.includes(s.id)}
                      onChange={(e) => setPgmStations(e.target.checked ? [...pgmStations, s.id] : pgmStations.filter((id) => id !== s.id))}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      {/* Team list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((e) => {
          const status = taskStatusFor(e.id);
          return (
          <div key={e.id} className="p-4 rounded-2xl border border-border bg-card hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center font-medium text-lg">{e.name.charAt(0)}</div>
                  <span className="absolute -bottom-1 -end-1 text-base leading-none w-5 h-5 flex items-center justify-center rounded-full bg-card border border-border" title={t(badgeFor(e.points || 0).key)}>{badgeFor(e.points || 0).icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  {editingTitle === e.id ? (
                    <div className="flex items-center gap-1">
                      <EmployeeNameLink employeeId={e.id} employeeName={e.name} className="block font-heading font-semibold truncate" />
                    </div>
                  ) : (
                    <p className="font-heading font-semibold truncate">{e.name}</p>
                  )}
                  {e.email && <p className="text-xs text-muted-foreground font-body truncate">{e.email}</p>}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {editingTitle === e.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={titleInput}
                          onChange={(ev) => setTitleInput(ev.target.value)}
                          placeholder={t("positionTitle")}
                          className="w-32 px-1.5 py-0.5 rounded border border-input text-xs font-body"
                        />
                        <button onClick={() => saveTitle(e.id)} className="p-1 rounded hover:bg-muted text-accent"><Check className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setEditingTitle(null)} className="p-1 rounded hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-body font-medium">
                        <Briefcase className="w-3 h-3" /> {e.profile?.position || e.customTitle || getRoleLabel(company, e.role, t)}
                        {canManage && (
                          <button onClick={() => { setEditingTitle(e.id); setTitleInput(e.profile?.position || e.customTitle || ""); }} className="hover:text-foreground">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-body font-medium border ${TASK_STATUS_STYLES[status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${TASK_STATUS_DOT[status]}`} /> {t(status)}
                    </span>
                  </div>
                </div>
              </div>
              <EmployeePoints points={e.points || 0} company={company} />
            </div>

            <EmployeePerformance targets={targets.filter((tg) => tg.assignment_type === "member" && tg.employee_id === e.id)} />

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border flex-wrap">
              {canManage && e.role !== "pgm" && (
                <div className="w-40">
                  <StationCombobox
                    t={t}
                    value={e.stationId || defaultStationId}
                    onChange={(val) => moveEmployee(e.id, val)}
                    placeholder={t("moveStation")}
                    className="h-7 px-2 py-1 text-xs"
                    options={data.stations.map((s) => ({ value: s.id, label: s.name }))}
                  />
                </div>
              )}
              <Link to={`/app/employees/${e.id}`} className="flex items-center gap-1.5 text-xs text-accent font-body hover:underline">
                <UserCircle className="w-3.5 h-3.5" /> {t("viewProfile")}
              </Link>
              {canTransfer && e.id !== currentUser.id && (
                <button onClick={() => switchUser(e.id)} className="text-xs text-accent font-body hover:underline">{t("switchUser")}</button>
              )}
              {canDeleteAccounts && e.id !== currentUser.id && e.id !== data.ownerId && (
                <ConfirmDeleteDialog
                  onConfirm={() => removeEmployee(e.id)}
                  trigger={
                    <button className="p-1.5 text-destructive hover:bg-muted rounded-md">
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  }
                />
              )}
            </div>
          </div>
          );
        })}
      </div>

    </div>
  );
}

function TransferModal({ type, onClose }) {
  const { t } = useI18n();
  const { data, company, currentUser } = useAuth();
  const [target, setTarget] = useState("");
  const [newOwner, setNewOwner] = useState({ name: "", email: "", password: "" });

  const candidates = data.employees.filter((e) => e.id !== currentUser.id);

  const transferDirector = () => {
    if (!target) return;
    let newDirName = "";
    updateCompany(company.id, (d) => {
      const oldDir = d.employees.find((x) => x.id === d.directorId);
      const newDir = d.employees.find((x) => x.id === target);
      if (oldDir) oldDir.role = "ops_manager";
      if (newDir) newDir.role = "director";
      newDirName = newDir?.name || target;
      d.directorId = target;
    });
    logAudit(company.id, "director_transferred", currentUser.name, `${currentUser.name} transferred the Director role to ${newDirName}.`);
    onClose();
  };

  const transferOwnership = () => {
    if (target) {
      // transfer to existing
      const targetName = candidates.find((c) => c.id === target)?.name || target;
      updateCompany(company.id, (d) => {
        d.ownerId = target;
      });
      logAudit(company.id, "ownership_transferred", currentUser.name, `${currentUser.name} transferred company ownership to ${targetName}.`);
      onClose();
    } else if (newOwner.name && newOwner.email && newOwner.password) {
      // register new owner
      updateCompany(company.id, (d) => {
        const emp = {
          id: "emp_" + Math.random().toString(36).slice(2, 9),
          name: newOwner.name,
          email: newOwner.email,
          role: "director",
          stationId: null,
          anonymousId: "ANON-" + Math.floor(Math.random() * 1e8).toString(16).toUpperCase().padStart(8, "0"),
          createdAt: new Date().toISOString(),
        };
        d.employees.push(emp);
        d.ownerId = emp.id;
      });
      // update registry credentials
      const reg = JSON.parse(localStorage.getItem("powercare_registry"));
      const c = reg.companies.find((x) => x.id === company.id);
      if (c) { c.ownerEmail = newOwner.email; c.ownerPassword = newOwner.password; }
      localStorage.setItem("powercare_registry", JSON.stringify(reg));
      logAudit(company.id, "ownership_transferred", currentUser.name, `${currentUser.name} transferred company ownership to new owner ${newOwner.name} (${newOwner.email}).`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{type === "director" ? t("transferDirector") : t("transferOwnership")}</h3>
        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("select")}</label>
          <MobileSelect
            value={target}
            onChange={setTarget}
            placeholder={t("select")}
            className="w-full"
            options={[{ value: "", label: "—" }, ...candidates.map((employee) => ({ value: employee.id, label: `${employee.name} (${getRoleLabel(company, employee.role, t)})` }))]}
          />
        </div>
        {type === "ownership" && !target && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-body">{t("newOwner")}</p>
            <input value={newOwner.name} onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })} placeholder={t("title")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input value={newOwner.email} onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })} placeholder={t("email")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input type="password" value={newOwner.password} onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })} placeholder={t("password")} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={type === "director" ? transferDirector : transferOwnership} className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("confirm")}</button>
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
        </div>
      </div>
    </div>
  );
}