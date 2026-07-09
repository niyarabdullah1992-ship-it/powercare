import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany, addNotification } from "@/lib/store";
import { canManageStations, visibleStations } from "@/lib/permissions";
import { Plus, Radio, Users, Trash2 } from "lucide-react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";

export default function Stations() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", type: "" });

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const canManage = canManageStations(currentUser);

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

  const statusTone = (s) => ({
    active: "bg-accent/15 text-accent",
    maintenance: "bg-amber-100 text-amber-700",
    stopped: "bg-destructive/15 text-destructive",
  }[s] || "bg-muted");

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
                    <h3 className="font-heading font-semibold">{s.name}</h3>
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