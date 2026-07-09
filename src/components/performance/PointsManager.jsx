import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { getPriorityPointsMap, DEFAULT_PRIORITY_POINTS } from "@/lib/rewards";
import { Info, Pencil, Save, RotateCcw, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const PRIORITIES = [
  { key: "urgent", labelKey: "pointsUrgent", color: "text-red-600" },
  { key: "high", labelKey: "pointsHigh", color: "text-orange-600" },
  { key: "medium", labelKey: "pointsMedium", color: "text-amber-600" },
  { key: "low", labelKey: "pointsLow", color: "text-muted-foreground" },
];

export default function PointsManager() {
  const { t } = useI18n();
  const { company, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => getPriorityPointsMap(company));

  if (!company || !currentUser) return null;

  const canEdit = ["director", "ops_manager"].includes(currentUser.role);
  const current = getPriorityPointsMap(company);

  const save = () => {
    const cleaned = {};
    for (const k of Object.keys(DEFAULT_PRIORITY_POINTS)) {
      const v = Number(draft[k]);
      cleaned[k] = Number.isFinite(v) && v >= 0 ? v : DEFAULT_PRIORITY_POINTS[k];
    }
    updateCompany(company.id, (d) => {
      d.rewardPoints = cleaned;
    });
    setDraft(cleaned);
    setEditing(false);
    toast({ title: t("pointsSaved") });
  };

  const reset = () => {
    updateCompany(company.id, (d) => {
      d.rewardPoints = { ...DEFAULT_PRIORITY_POINTS };
    });
    setDraft({ ...DEFAULT_PRIORITY_POINTS });
    setEditing(false);
    toast({ title: t("pointsSaved") });
  };

  return (
    <div className="space-y-3">
      {/* Explanation card */}
      <div className="p-4 rounded-xl border border-border bg-card flex items-start gap-3">
        <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-heading font-semibold text-sm">{t("pointsExplanation")}</p>
          <p className="text-xs text-muted-foreground font-body leading-relaxed">{t("pointsExplanationText")}</p>
          <div className="flex flex-wrap gap-2 pt-1.5">
            {PRIORITIES.map((p) => (
              <span key={p.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-body border border-border bg-muted/50">
                <span className={p.color}>●</span> {t(p.labelKey)}: <span className="font-medium">{current[p.key]}</span> {t("points")}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit panel (company admins only) */}
      {canEdit && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-heading font-semibold text-sm flex items-center gap-1.5">
              <Pencil className="w-4 h-4" /> {t("editPoints")}
            </p>
            {!editing ? (
              <button onClick={() => { setDraft(current); setEditing(true); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                <Pencil className="w-3.5 h-3.5" /> {t("edit")}
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                  <Save className="w-3.5 h-3.5" /> {t("savePoints")}
                </button>
                <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
                  <RotateCcw className="w-3.5 h-3.5" /> {t("resetPoints")}
                </button>
                <button onClick={() => setEditing(false)} className="p-1.5 rounded-md hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {editing && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRIORITIES.map((p) => (
                <div key={p.key}>
                  <label className="text-xs text-muted-foreground font-body block mb-1 flex items-center gap-1">
                    <span className={p.color}>●</span> {t(p.labelKey)}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={draft[p.key]}
                    onChange={(e) => setDraft({ ...draft, [p.key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input text-sm font-body"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}