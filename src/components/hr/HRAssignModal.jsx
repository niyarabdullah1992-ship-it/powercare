import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

// Assign an existing (unassigned) employee, or hire a new one, into a given HR slot.
export default function HRAssignModal({ title, defaultPosition, eligibleEmployees, onAssignExisting, onHireNew, onClose }) {
  const { t } = useI18n();
  const [mode, setMode] = useState("existing");
  const [empId, setEmpId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState(defaultPosition || "");

  const submit = (e) => {
    e.preventDefault();
    if (mode === "existing") {
      if (!empId) return;
      onAssignExisting(empId, position.trim());
    } else {
      if (!name.trim()) return;
      onHireNew({ name: name.trim(), email: email.trim(), position: position.trim() });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{title}</h3>

        <div className="flex gap-1.5 p-1 rounded-lg bg-muted">
          <button type="button" onClick={() => setMode("existing")} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-body ${mode === "existing" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {t("existingEmployee")}
          </button>
          <button type="button" onClick={() => setMode("hire")} className={`flex-1 px-3 py-1.5 rounded-md text-xs font-body ${mode === "hire" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {t("hireNew")}
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "existing" ? (
            <div>
              <label className="block text-xs text-muted-foreground font-body mb-1">{t("selectEmployee")}</label>
              <select value={empId} onChange={(e) => setEmpId(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
                <option value="">—</option>
                {eligibleEmployees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("employeeName") || "Name"}</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card" />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground font-body mb-1">{t("email")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card" />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("position")}</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("confirm")}</button>
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}