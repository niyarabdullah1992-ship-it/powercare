import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageHRLevels } from "@/lib/permissions";
import ClusterEditor from "@/components/hr/ClusterEditor";
import SimDifChart from "@/components/hr/SimDifChart";

export default function HR() {
  const { t } = useI18n();
  const { data, currentUser } = useAuth();
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);

  if (!data || !currentUser) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("simdifTitle")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("clusterLevel")}</h2>
        <ClusterEditor data={data} canManage={canManage} myStationId={currentUser.stationId} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("simdifTitle")}</h2>
        <SimDifChart data={data} canManage={canManage} />
      </section>
    </div>
  );
}