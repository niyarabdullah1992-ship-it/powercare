import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageHRLevels, visibleStations } from "@/lib/permissions";
import ClusterEditor from "@/components/hr/ClusterEditor";
import HRTiersEditor from "@/components/hr/HRTiersEditor";
import HROrgChart from "@/components/hr/HROrgChart";

export default function HR() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("clusterLevel")}</h2>
        <ClusterEditor data={data} canManage={canManage} myStationId={currentUser.stationId} />
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("hrLevels")}</h2>
          <HRTiersEditor data={data} canManage={canManage} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">{t("orgChart")}</h2>
        {stations.map((s) => (
          <HROrgChart key={s.id} station={s} data={data} canManage={canManage} />
        ))}
      </section>
    </div>
  );
}