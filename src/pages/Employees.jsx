import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canManageEmployees, canTransferOwnership, visibleStations, visibleEmployees } from "@/lib/permissions";
import { Plus, Trash2, Search, ArrowLeft, AlertTriangle, KeyRound, UserCog } from "lucide-react";
import { badgeFor, nextBadge } from "@/lib/rewards";

const ROLES = ["employee", "station_manager", "pgm", "ops_manager", "director"];

export default function Employees() {
  const { t } = useI18n();
  const { data, currentUser, company, switchUser } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "employee", stationId: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showTransfer, setShowTransfer] = useState(null);

  if (!data || !currentUser) return null;
  const canManage = canManageEmployees(currentUser);
  const canTransfer = canTransferOwnership(currentUser);
  const stations = visibleStations(currentUser, data);

  // Drill-down: show station grid first
  if (!selectedStation) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-3xl font-semibold">{t("employees")}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => {
            const team = data.employees.filter((e) => e.stationId === s.id);
            const hasManager = team.some((e) => e.role === "station_manager");
            const counts = ROLES.reduce((acc, r) => ({ ...acc, [r]: team.filter((e) => e.role === r).length }), {});
            return (
              <button key={s.id} onClick={() => setSelectedStation(s.id)} className="text-start p-5 rounded-xl border border-border bg-card hover:border-accent transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-semibold">{s.name}</h3>
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
                      {counts[r]} {t(r)}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Station team view
  const station = data.stations.find((s) => s.id === selectedStation);
  let team = data.employees.filter((e) => e.stationId === selectedStation || (e.role === "pgm" && (e.managedStations || []).includes(selectedStation)));
  if (search) team = team.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase()));
  if (roleFilter !== "all") team = team.filter((e) => e.role === roleFilter);

  const addEmployee = (e) => {
    e.preventDefault();
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
      d.employees.push(emp);
      if (form.role === "station_manager") {
        const s = d.stations.find((x) => x.id === selectedStation);
        if (s) s.managerId = emp.id;
      }
    });
    setShowAdd(false);
    setForm({ name: "", email: "", role: "employee", stationId: "" });
  };

  const removeEmployee = (id) => {
    if (!confirm(t("confirmDelete"))) return;
    updateCompany(company.id, (d) => {
      d.employees = d.employees.filter((x) => x.id !== id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedStation(null)} className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-heading text-3xl font-semibold">{station?.name}</h1>
          <p className="text-muted-foreground font-body text-sm">{t("team")}</p>
        </div>
      </div>

      {/* Director sensitive actions */}
      {canTransfer && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setShowTransfer("director")} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <UserCog className="w-3.5 h-3.5" /> {t("transferDirector")}
          </button>
          <button onClick={() => setShowTransfer("ownership")} className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <KeyRound className="w-3.5 h-3.5" /> {t("transferOwnership")}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="w-full ps-9 pe-3 py-2 rounded-md border border-input text-sm font-body" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body">
          <option value="all">{t("all")}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(r)}</option>)}
        </select>
        {canManage && (
          <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Plus className="w-4 h-4" /> {t("addEmployee")}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={addEmployee} className="p-5 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("title")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={t("email")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 rounded-md border border-input text-sm font-body">
            {ROLES.map((r) => <option key={r} value={r}>{t(r)}</option>)}
          </select>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      {/* Team list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {team.map((e) => (
          <div key={e.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-medium">{e.name.charAt(0)}</div>
                <span className="absolute -bottom-1 -end-1 text-base leading-none" title={t(badgeFor(e.points || 0).key)}>{badgeFor(e.points || 0).icon}</span>
              </div>
              <div className="min-w-0">
                <p className="font-body font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground font-body truncate">{t(e.role)}{e.email ? ` · ${e.email}` : ""}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-body font-medium">
                    {e.points || 0} {t("points")}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-body">{t(badgeFor(e.points || 0).key)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {e.id !== currentUser.id && (
                <button onClick={() => switchUser(e.id)} className="text-xs text-accent font-body hover:underline">{t("switchUser")}</button>
              )}
              {canManage && (
                <button onClick={() => removeEmployee(e.id)} className="p-1.5 text-destructive hover:bg-muted rounded-md">
                  <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showTransfer && <TransferModal type={showTransfer} onClose={() => setShowTransfer(null)} />}
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
    updateCompany(company.id, (d) => {
      const oldDir = d.employees.find((x) => x.id === d.directorId);
      const newDir = d.employees.find((x) => x.id === target);
      if (oldDir) oldDir.role = "ops_manager";
      if (newDir) newDir.role = "director";
      d.directorId = target;
    });
    onClose();
  };

  const transferOwnership = () => {
    if (target) {
      // transfer to existing
      updateCompany(company.id, (d) => {
        d.ownerId = target;
      });
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
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{type === "director" ? t("transferDirector") : t("transferOwnership")}</h3>
        <div>
          <label className="block text-xs text-muted-foreground font-body mb-1">{t("select")}</label>
          <select value={target} onChange={(e) => setTarget(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
            <option value="">—</option>
            {candidates.map((e) => <option key={e.id} value={e.id}>{e.name} ({t(e.role)})</option>)}
          </select>
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