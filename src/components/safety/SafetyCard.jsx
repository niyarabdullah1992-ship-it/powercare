import React from "react";
import { HardHat, Building2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

const LEVEL_MAP = {
  green: { tone: "bg-accent/15 text-accent", icon: CheckCircle, label: "Safe" },
  amber: { tone: "bg-amber-100 text-amber-700", icon: AlertTriangle, label: "Caution" },
  red: { tone: "bg-destructive/15 text-destructive", icon: XCircle, label: "Critical" },
};

export default function SafetyCard({ t, lang, name, isHQ, safety }) {
  const L = LEVEL_MAP[safety.level] || LEVEL_MAP.amber;
  const Icon = isHQ ? Building2 : HardHat;

  return (
    <div className={`p-5 rounded-xl border bg-card space-y-3 ${isHQ ? "border-accent/40" : "border-border"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${isHQ ? "text-accent" : "text-muted-foreground"}`} strokeWidth={1.75} />
          <h3 className="font-heading font-semibold">{name}</h3>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body ${L.tone}`}>
          <L.icon className="w-3 h-3" /> {L.label}
        </span>
      </div>
      <div className="space-y-1.5 text-sm font-body">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("lastInspection")}</span>
          <span>{safety.lastInspection ? new Date(safety.lastInspection).toLocaleDateString(lang) : "—"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t("incidents")}</span>
          <span>{safety.incidents}</span>
        </div>
      </div>
      {safety.hazards?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground font-body mb-1">{t("hazards")}</p>
          <ul className="space-y-1">
            {safety.hazards.map((h, i) => (
              <li key={i} className="text-xs font-body flex items-center gap-1.5 text-foreground/80">
                <span className="w-1 h-1 rounded-full bg-destructive" /> {h}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}