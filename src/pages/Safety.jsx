import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canSeeAllStations } from "@/lib/permissions";
import { AlertTriangle } from "lucide-react";
import SafetyCard from "@/components/safety/SafetyCard";

const HQ_SAFETY_ID = "hq";
const DEFAULT_SAFETY = { level: "green", incidents: 0, hazards: [], lastInspection: null };

export default function Safety() {
  const { t, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const stationIds = new Set(stations.map((s) => s.id));
  const safetyFor = (id) => data.safety.find((s) => s.stationId === id) || DEFAULT_SAFETY;
  const allSafety = stations.map((s) => ({ station: s, safety: safetyFor(s.id) }));

  const showHq = canSeeAllStations(currentUser) && !company?.hqHidden;
  const hqLabel = company?.hqLabel || t("hq");
  const hqSafety = data.safety.find((s) => s.stationId === HQ_SAFETY_ID) || DEFAULT_SAFETY;

  // group visible stations by station type — a "global system" view organized by section
  const groups = {};
  allSafety.forEach(({ station, safety }) => {
    const key = station.type?.trim() || t("customType");
    groups[key] = groups[key] || [];
    groups[key].push({ station, safety });
  });

  const redCount =
    allSafety.filter((s) => s.safety.level === "red").length + (showHq && hqSafety.level === "red" ? 1 : 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("safety")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          {stations.length} {t("stations").toLowerCase()}
        </p>
      </div>

      {redCount > 0 && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <p className="text-sm font-body text-destructive">
            {redCount} {t("stations").toLowerCase()} {t("safetyLevel").toLowerCase()}: {t("high")}
          </p>
        </div>
      )}

      {Object.keys(groups).length === 0 && !showHq && (
        <p className="text-sm text-muted-foreground font-body">{t("noTasks")}</p>
      )}

      {Object.entries(groups).map(([type, items]) => (
        <div key={type} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg font-semibold">{type}</h2>
            <span className="text-xs text-muted-foreground font-body">
              {items.length} {t("stations").toLowerCase()}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {showHq && <SafetyCard t={t} lang={lang} name={hqLabel} isHQ safety={hqSafety} />}
            {items.map(({ station, safety }) => (
              <SafetyCard key={station.id} t={t} lang={lang} name={station.name} safety={safety} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}