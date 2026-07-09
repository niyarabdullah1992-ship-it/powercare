import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function AddHRModal({ title, employees, levels, stations, onAdd, onClose }) {
  const { t } = useI18n();
  const [empId, setEmpId] = useState("");
  const [levelId, setLevelId] = useState("");
  const [stationId, setStationId] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!empId || !levelId) return;
    onAdd(empId, levelId, stationId || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{title}</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("selectEmployee")}</label>
            <select value={empId} onChange={(e) => setEmpId(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
              <option value="">—</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("level")}</label>
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
              <option value="">—</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          {stations && (
            <div>
              <label className="block text-xs text-muted-foreground font-body mb-1">{t("station")}</label>
              <select value={stationId} onChange={(e) => setStationId(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
                <option value="">{t("companyWide")}</option>
                {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("confirm")}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}