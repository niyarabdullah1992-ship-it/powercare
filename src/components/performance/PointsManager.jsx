import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { getPriorityPointsMap, DEFAULT_PRIORITY_POINTS } from "@/lib/rewards";
import { Info, Pencil, Save, RotateCcw, X, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const PRIORITIES = [
  { key: "urgent", labelKey: "pointsUrgent", dot: "bg-red-500", ring: "ring-red-500/20", text: "text-red-600" },
  { key: "high", labelKey: "pointsHigh", dot: "bg-orange-500", ring: "ring-orange-500/20", text: "text-orange-600" },
  { key: "medium", labelKey: "pointsMedium", dot: "bg-amber-500", ring: "ring-amber-500/20", text: "text-amber-600" },
  { key: "low", labelKey: "pointsLow", dot: "bg-gray-400", ring: "ring-gray-400/20", text: "text-muted-foreground" },
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
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      {/* Header band */}
      <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold leading-tight">{t("pointsExplanation")}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">{t("pointsExplanationText")}</p>
        </div>
      </div>

      {/* Points grid */}
      <div className="p-5 space-y-4">
        {!editing ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRIORITIES.map((p) => (
              <div key={p.key} className={`relative p-4 rounded-xl border border-border bg-background ring-1 ${p.ring}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                  <span className="text-xs font-body text-muted-foreground">{t(p.labelKey)}</span>
                </div>
                <p className="font-heading text-2xl font-semibold leading-none">
                  {current[p.key]}
                  <span className="text-xs font-body text-muted-foreground font-normal ms-1">{t("points")}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PRIORITIES.map((p) => (
              <div key={p.key} className={`p-4 rounded-xl border border-border bg-background ring-1 ${p.ring}`}>
                <label className="flex items-center gap-2 text-xs font-body text-muted-foreground mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.dot}`} />
                  {t(p.labelKey)}
                </label>
                <input
                  type="number"
                  min="0"
                  value={draft[p.key]}
                  onChange={(e) => setDraft({ ...draft, [p.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-input text-lg font-heading font-semibold bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            ))}
          </div>
        )}

        {/* Action row */}
        {canEdit && (
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground font-body truncate">{t("editPointsHint")}</p>
            </div>
            {!editing ? (
              <button onClick={() => { setDraft(current); setEditing(true); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-xs font-body hover:bg-muted transition-colors shrink-0">
                <Pencil className="w-3.5 h-3.5" /> {t("edit")}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={save} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-foreground text-background text-xs font-body hover:bg-accent transition-colors">
                  <Save className="w-3.5 h-3.5" /> {t("savePoints")}
                </button>
                <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-body hover:bg-muted transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> {t("resetPoints")}
                </button>
                <button onClick={() => setEditing(false)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}