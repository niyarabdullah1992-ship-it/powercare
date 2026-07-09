import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { visibleStations, canCreateTasks } from "@/lib/permissions";
import { Plus, CalendarRange } from "lucide-react";

export default function Plans() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", startDate: "", endDate: "", notes: "", stationId: "" });

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));
  const plans = data.plans.filter((p) => stationIds.has(p.stationId));
  const canManage = canCreateTasks(currentUser);
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";

  const add = (e) => {
    e.preventDefault();
    updateCompany(company.id, (d) => {
      d.plans.push({
        id: "plan_" + Math.random().toString(36).slice(2, 9),
        title: form.title,
        stationId: form.stationId || stations[0]?.id,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : new Date().toISOString(),
        status: "scheduled",
        notes: form.notes,
      });
    });
    setShowAdd(false);
    setForm({ title: "", startDate: "", endDate: "", notes: "", stationId: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-semibold">{t("plans")}</h1>
        {canManage && (
          <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Plus className="w-4 h-4" /> {t("newPlan")}
          </button>
        )}
      </div>

      {showAdd && (
        <form onSubmit={add} className="p-5 rounded-xl border border-border bg-card grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("title")} required className="px-3 py-2 rounded-md border border-input text-sm font-body md:col-span-2" />
          <select value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })} className="px-3 py-2 rounded-md border border-input text-sm font-body md:col-span-2">
            <option value="">— {t("stations")} —</option>
            {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t("note")} rows={2} className="px-3 py-2 rounded-md border border-input text-sm font-body resize-none md:col-span-2" />
          <div className="flex gap-2 md:col-span-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.length === 0 && <p className="text-sm text-muted-foreground font-body">No plans yet.</p>}
        {plans.map((p) => (
          <div key={p.id} className="p-5 rounded-xl border border-border bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-accent" strokeWidth={1.75} />
                <h3 className="font-heading font-semibold">{p.title}</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-body text-muted-foreground">{t(p.status)}</span>
            </div>
            <p className="text-xs text-muted-foreground font-body">{stationName(p.stationId)}</p>
            <p className="text-sm font-body text-muted-foreground">
              {new Date(p.startDate).toLocaleDateString(lang)} → {new Date(p.endDate).toLocaleDateString(lang)}
            </p>
            {p.notes && <p className="text-sm font-body">{p.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}