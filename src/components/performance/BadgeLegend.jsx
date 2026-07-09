import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { getBadges, DEFAULT_BADGE_THRESHOLDS } from "@/lib/rewards";
import { Award, Pencil, Save, RotateCcw, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const TIER_STYLES = [
  "from-emerald-500/15 to-emerald-500/5 ring-emerald-500/20 text-emerald-600",
  "from-teal-500/15 to-teal-500/5 ring-teal-500/20 text-teal-600",
  "from-amber-500/15 to-amber-500/5 ring-amber-500/20 text-amber-600",
  "from-orange-500/15 to-orange-500/5 ring-orange-500/20 text-orange-600",
  "from-rose-500/15 to-rose-500/5 ring-rose-500/20 text-rose-600",
];

export default function BadgeLegend() {
  const { t } = useI18n();
  const { company, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const badges = getBadges(company);
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(badges.map((b) => [b.key, b.min]))
  );

  if (!company || !currentUser) return null;

  const canEdit = ["director", "ops_manager"].includes(currentUser.role);

  const save = () => {
    const cleaned = {};
    for (const k of Object.keys(DEFAULT_BADGE_THRESHOLDS)) {
      const v = Number(draft[k]);
      cleaned[k] = Number.isFinite(v) && v >= 0 ? v : DEFAULT_BADGE_THRESHOLDS[k];
    }
    // Ensure ascending order
    const ordered = Object.entries(cleaned).sort((a, b) => a[1] - b[1]);
    updateCompany(company.id, (d) => {
      d.badgeThresholds = Object.fromEntries(ordered);
    });
    setDraft(cleaned);
    setEditing(false);
    toast({ title: t("pointsSaved") });
  };

  const reset = () => {
    updateCompany(company.id, (d) => {
      d.badgeThresholds = { ...DEFAULT_BADGE_THRESHOLDS };
    });
    setDraft({ ...DEFAULT_BADGE_THRESHOLDS });
    setEditing(false);
    toast({ title: t("pointsSaved") });
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-foreground text-background flex items-center justify-center shrink-0">
          <Award className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base font-semibold leading-tight">{t("badgeTiers")}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{t("badgeTiersHint")}</p>
        </div>
        {canEdit && !editing && (
          <button onClick={() => { setDraft(Object.fromEntries(badges.map((b) => [b.key, b.min]))); setEditing(true); }} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-xs font-body hover:bg-muted transition-colors shrink-0">
            <Pencil className="w-3.5 h-3.5" /> {t("edit")}
          </button>
        )}
        {canEdit && editing && (
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
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {badges.map((b, i) => (
          <div
            key={b.key}
            className={`relative p-4 rounded-xl border border-border bg-gradient-to-b ring-1 ${TIER_STYLES[i] || TIER_STYLES[0]}`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl leading-none">{b.icon}</span>
              <span className="text-sm font-heading font-semibold">{t(b.key)}</span>
            </div>
            {!editing ? (
              <p className="text-xs font-body text-muted-foreground">
                {b.min}+ {t("points")}
              </p>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={draft[b.key]}
                  onChange={(e) => setDraft({ ...draft, [b.key]: e.target.value })}
                  className="w-20 px-2 py-1 rounded-md border border-input text-sm font-heading font-semibold bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-xs font-body text-muted-foreground">+ {t("points")}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}