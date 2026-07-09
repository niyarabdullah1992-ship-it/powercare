import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageHRLevels, canManageEmployees } from "@/lib/permissions";
import HRLevelsManager from "@/components/hr/HRLevelsManager";
import HRStationCard from "@/components/hr/HRStationCard";

export default function HR() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const canAssign = canManageEmployees(currentUser);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>

      {canManageHRLevels(currentUser) && <HRLevelsManager data={data} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stations.map((s) => (
          <HRStationCard key={s.id} station={s} data={data} currentUser={currentUser} canAssign={canAssign} />
        ))}
      </div>
    </div>
  );
}