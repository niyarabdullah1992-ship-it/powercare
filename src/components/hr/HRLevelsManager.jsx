import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { updateCompany } from "@/lib/store";
import { HR_PERMISSIONS, hrPermLabel } from "@/lib/hrPermissions";
import { Plus, Trash2 } from "lucide-react";

export default function HRLevelsManager({ data }) {
  const { t, lang } = useI18n();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [maxCount, setMaxCount] = useState("");
  const [perms, setPerms] = useState([]);
  const levels = data.hrLevels || [];
  const countFor = (levelId) => data.employees.filter((e) => e.hrLevelId === levelId).length;

  const togglePerm = (key) => {
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));
  };

  const addLevel = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateCompany(data.id, (d) => {
      d.hrLevels = d.hrLevels || [];
      d.hrLevels.push({
        id: "hrl_" + Math.random().toString(36).slice(2, 9),
        name: name.trim(),
        permissions: perms,
        maxCount: maxCount ? Number(maxCount) : null,
      });
    });
    setName(""); setMaxCount(""); setPerms([]); setShowAdd(false);
  };

  const removeLevel = (id) => {
    if (!confirm(t("confirmDelete"))) return;
    updateCompany(data.id, (d) => {
      d.hrLevels = (d.hrLevels || []).filter((l) => l.id !== id);
      d.employees.forEach((emp) => {
        if (emp.hrLevelId === id) { emp.hrLevelId = null; emp.hrParentId = null; emp.hrStationId = null; }
      });
    });
  };

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-lg">{t("hrLevels")}</h3>
        <button onClick={() => setShowAdd((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
          <Plus className="w-3.5 h-3.5" /> {t("addLevel")}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addLevel} className="p-4 rounded-lg border border-border space-y-3">
          <div className="flex gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("levelName")} required className="flex-1 px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input value={maxCount} onChange={(e) => setMaxCount(e.target.value)} type="number" min="1" placeholder={t("maxCount")} className="w-36 px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <div className="flex flex-wrap gap-2">
            {HR_PERMISSIONS.map((key) => (
              <label key={key} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-body cursor-pointer">
                <input type="checkbox" checked={perms.includes(key)} onChange={() => togglePerm(key)} />
                {hrPermLabel(key, lang)}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-foreground text-background text-sm">{t("save")}</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md border border-border text-sm">{t("cancel")}</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {levels.length === 0 && <p className="text-sm text-muted-foreground font-body">{t("noLevels")}</p>}
        {levels.map((l) => (
          <div key={l.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-body font-medium text-sm">
                {l.name} <span className="text-xs text-muted-foreground font-normal">· {countFor(l.id)}/{l.maxCount || t("unlimited")}</span>
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {(l.permissions || []).map((p) => (
                  <span key={p} className="px-2 py-0.5 rounded-full bg-muted text-[10px] font-body text-muted-foreground">{hrPermLabel(p, lang)}</span>
                ))}
              </div>
            </div>
            <button onClick={() => removeLevel(l.id)} className="p-1.5 text-destructive hover:bg-muted rounded-md">
              <Trash2 className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}