import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";

export default function HireHRModal({ levels, onHire, onClose }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [levelId, setLevelId] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !levelId) return;
    onHire({ name: name.trim(), email: email.trim() }, levelId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-xl border border-border p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-heading text-xl font-semibold">{t("hireHR")}</h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("title")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground font-body mb-1">{t("level")}</label>
            <select value={levelId} onChange={(e) => setLevelId(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
              <option value="">—</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
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