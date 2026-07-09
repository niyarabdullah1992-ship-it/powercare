import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import { HardHat, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function Safety() {
  const { t, lang } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));
  const safety = data.safety.filter((s) => stationIds.has(s.stationId));
  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || "—";

  const levelMap = {
    green: { tone: "bg-accent/15 text-accent", icon: CheckCircle, label: "Safe" },
    amber: { tone: "bg-amber-100 text-amber-700", icon: AlertTriangle, label: "Caution" },
    red: { tone: "bg-destructive/15 text-destructive", icon: XCircle, label: "Critical" },
  };

  const redCount = safety.filter((s) => s.level === "red").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("safety")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{safety.length} {t("stations").toLowerCase()}</p>
      </div>

      {redCount > 0 && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-body text-destructive">{redCount} {t("stations").toLowerCase()} {t("safetyLevel").toLowerCase()}: {t("high")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safety.map((s) => {
          const L = levelMap[s.level] || levelMap.amber;
          return (
            <div key={s.id} className="p-5 rounded-xl border border-border bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                  <h3 className="font-heading font-semibold">{stationName(s.stationId)}</h3>
                </div>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body ${L.tone}`}>
                  <L.icon className="w-3 h-3" /> {L.label}
                </span>
              </div>
              <div className="space-y-1.5 text-sm font-body">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("lastInspection")}</span><span>{new Date(s.lastInspection).toLocaleDateString(lang)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("incidents")}</span><span>{s.incidents}</span></div>
              </div>
              {s.hazards.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-body mb-1">{t("hazards")}</p>
                  <ul className="space-y-1">
                    {s.hazards.map((h, i) => (
                      <li key={i} className="text-xs font-body flex items-center gap-1.5 text-foreground/80">
                        <span className="w-1 h-1 rounded-full bg-destructive" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}