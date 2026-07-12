import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { getRoleLabel } from "@/lib/roles";
import { Link } from "react-router-dom";
import { ChevronDown, ShieldCheck, Pencil, Briefcase, GitBranch } from "lucide-react";

// Ranked highest → lowest authority.
const GRADES = ["director", "ops_manager", "pgm", "station_manager", "employee"];

export default function RolesGuide({ company }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-2 p-4 text-start">
        <span className="flex items-center gap-2 font-heading font-semibold text-sm">
          <ShieldCheck className="w-4 h-4 text-accent" /> {t("rolesGuideTitle")}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          <p className="text-xs text-muted-foreground font-body">{t("rolesGuideIntro")}</p>
          <div className="space-y-2">
            {GRADES.map((r, i) => (
              <div key={r} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-background">
                <span className="w-6 h-6 shrink-0 rounded-full bg-secondary flex items-center justify-center text-[11px] font-body font-semibold">{GRADES.length - i}</span>
                <div className="min-w-0">
                  <p className="text-sm font-body font-semibold" dir="auto">{getRoleLabel(company, r, t)}</p>
                  <p className="text-xs text-muted-foreground font-body">{t(`roleDesc_${r}`)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="flex items-start gap-2 text-xs text-muted-foreground font-body">
              <Pencil className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" /> {t("rolesGuideRename")}
            </p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground font-body">
              <Briefcase className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" /> {t("rolesGuideCustomTitle")}
            </p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground font-body">
              <GitBranch className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" /> {t("rolesGuideHrNote")}{" "}
              <Link to="/app/hr" className="text-accent hover:underline shrink-0">{t("hr")}</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}