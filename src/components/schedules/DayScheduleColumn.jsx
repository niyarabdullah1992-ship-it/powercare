import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { addShift, removeShift } from "@/lib/store";
import { Plus, X, Clock } from "lucide-react";

export default function DayScheduleColumn({ companyId, stationId, day, dayLabel, shifts, canManage }) {
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "", start: "08:00", end: "16:00" });

  const submit = (e) => {
    e.preventDefault();
    addShift(companyId, stationId, day, { label: form.label.trim(), start: form.start, end: form.end });
    setForm({ label: "", start: "08:00", end: "16:00" });
    setAdding(false);
  };

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading font-semibold">{dayLabel}</h3>
      <div className="space-y-2">
        {shifts.length === 0 && <p className="text-xs text-muted-foreground font-body">{t("noShifts")}</p>}
        {shifts.map((sh) => (
          <div key={sh.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted text-xs font-body">
            <span className="flex items-center gap-1.5 truncate">
              <Clock className="w-3 h-3 shrink-0 text-accent" />
              {sh.label ? `${sh.label} — ` : ""}{sh.start}–{sh.end}
            </span>
            {canManage && (
              <button onClick={() => removeShift(companyId, stationId, day, sh.id)} className="text-destructive hover:opacity-70 shrink-0">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      {canManage && (
        adding ? (
          <form onSubmit={submit} className="space-y-1.5 pt-2 border-t border-border">
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder={t("shiftLabel")} className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body" />
            <div className="flex gap-1.5">
              <input type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body" />
              <input type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} required className="w-full px-2 py-1.5 rounded-md border border-input text-xs font-body" />
            </div>
            <div className="flex gap-1.5">
              <button type="submit" className="flex-1 px-2 py-1.5 rounded-md bg-foreground text-background text-xs font-body">{t("save")}</button>
              <button type="button" onClick={() => setAdding(false)} className="flex-1 px-2 py-1.5 rounded-md border border-border text-xs font-body">{t("cancel")}</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-xs text-accent font-body hover:underline pt-2 border-t border-border w-full">
            <Plus className="w-3 h-3" /> {t("addShift")}
          </button>
        )
      )}
    </div>
  );
}