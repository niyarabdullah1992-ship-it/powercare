import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canManageStations, canSeeAllStations, visibleStations } from "@/lib/permissions";
import { Plus, Radio, Building2, Users, Trash2, Pencil, Check, X } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function Stations() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", type: "" });
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const canManage = canManageStations(currentUser);
  const showHq = canSeeAllStations(currentUser);
  const hqTeam = data.employees.filter((e) => !e.stationId);
  const hqLabel = company?.hqLabel || t("hq");

  const add = (e) => {
    e.preventDefault();
    updateCompany(company.id, (d) => {
      d.stations.push({
        id: "st_" + Math.random().toString(36).slice(2, 9),
        name: form.name,
        location: form.location,
        type: form.type,
        status: "active",
        managerId: null,
        createdAt: new Date().toISOString(),
      });
    });
    setShowAdd(false);
    setForm({ name: "", location: "", type: "" });
  };

  const cycleStatus = (id) => {
    if (!canManage) return;
    const order = ["active", "maintenance", "stopped"];
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) s.status = order[(order.indexOf(s.status) + 1) % order.length];
    });
  };

  const removeStation = (id) => {
    if (!canManage) return;
    updateCompany(company.id, (d) => {
      d.stations = d.stations.filter((x) => x.id !== id);
    });
  };

  const startRename = (id, currentName) => {
    setRenamingId(id);
    setRenameVal(currentName);
  };

  const submitRename = () => {
    const name = renameVal.trim();
    if (!name) { setRenamingId(null); return; }
    if (renamingId === "hq") {
      updateCompany(company.id, (d) => { d.hqLabel = name; });
    } else {
      updateCompany(company.id, (d) => {
        const s = d.stations.find((x) => x.id === renamingId);
        if (s) s.name = name;
      });
    }
    setRenamingId(null);
  };

  const statusTone = (s) => ({
    active: "bg-accent/15 text-accent",
    maintenance: "bg-amber-100 text-amber-700",
    stopped: "bg-destructive/15 text-destructive",
  }[s] || "bg-muted");

  const renameField = (id, name) =>
    renamingId === id ? (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={renameVal}
          onChange={(e) => setRenameVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename(); } if (e.key === "Escape") setRenamingId(null); }}
          className="px-2 py-1 rounded-md border border-input text-sm font-body font-heading font-semibold"
        />
        <button onClick={submitRename} className="p-1 rounded-md hover:bg-accent/10 text-accent"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={() => setRenamingId(null)} className="p-1 rounded-md hover:bg-muted text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 group">
        <h3 className="font-heading font-semibold">{name}</h3>
        {canManage && (
          <button onClick={() => startRename(id, name)} className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition hover:bg-muted text-muted-foreground hover:text-foreground">
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{t("stations")}</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{stations.length} {t("stations").toLowerCase()}</p>
        </div>
        {canManage && (
          <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Plus className="w-4 h-4" /> {t("addStation")}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={add} className="p-5 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("stationName")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder={t("location")} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder={t("stationType")} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {showHq && (
          <div className="p-5 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-accent" strokeWidth={1.75} />
                {renameField("hq", hqLabel)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm font-body">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="w-3.5 h-3.5" /> {hqTeam.length}
              </span>
            </div>
          </div>
        )}

        {stations.map((s) => {
          const team = data.employees.filter((e) => e.stationId === s.id);
          const manager = data.employees.find((e) => e.id === s.managerId);
          const tasks = data.tasks.filter((tk) => tk.stationId === s.id);
          const done = tasks.filter((tk) => tk.status === "completed").length;
          const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
          return (
            <div key={s.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-accent" strokeWidth={1.75} />
                  <div>
                    {renameField(s.id, s.name)}
                    <p className="text-xs text-muted-foreground font-body">{s.location} · {s.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => cycleStatus(s.id)} disabled={!canManage} className={`px-2 py-0.5 rounded-full text-[10px] font-body ${statusTone(s.status)} ${canManage ? "cursor-pointer" : "cursor-default"}`}>
                    {s.status}
                  </button>
                  {canManage && (
                    <ConfirmDeleteDialog
                      onConfirm={() => removeStation(s.id)}
                      trigger={
                        <button className="p-1 rounded-md hover:bg-destructive/10 text-destructive" title={t("delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      }
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm font-body">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" /> {team.length}
                </span>
                <span className="text-muted-foreground">{pct}% {t("taskCompletion").toLowerCase()}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs font-body">
                {manager ? <span className="text-foreground">{t("manager")}: {manager.name}</span> : <span className="text-amber-600">⚠ {t("noManager")}</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}