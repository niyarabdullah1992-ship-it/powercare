import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageHRLevels } from "@/lib/permissions";
import { updateCompany } from "@/lib/store";
import { buildHRLevels } from "@/lib/hrLevels";
import ClusterEditor from "@/components/hr/ClusterEditor";
import HROrgChart from "@/components/hr/HROrgChart";
import HRTiersEditor from "@/components/hr/HRTiersEditor";

const HR_SCHEMA_VERSION = 5; // flexible, company-customizable hierarchy

export default function HR() {
  const { t, lang } = useI18n();
  const { data, currentUser } = useAuth();
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);
  const [orgChartStationId, setOrgChartStationId] = useState(null);

  useEffect(() => {
    if (data && canManage && data.hrSchemaVersion !== HR_SCHEMA_VERSION) {
      updateCompany(data.id, (d) => {
        d.hrLevels = buildHRLevels();
        d.hrClusters = d.hrClusters || [];
        d.employees.forEach((e) => {
          e.hrLevelId = null;
          e.hrStationId = null;
          e.hrClusterId = null;
          delete e.hrParentId;
        });
        d.hrSchemaVersion = HR_SCHEMA_VERSION;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id, currentUser?.id, canManage]);

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);
  const orgChartStation = stations.find((s) => s.id === orgChartStationId) || null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("globalHrHierarchy")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("hrLevels")}</h2>
        <HRTiersEditor data={data} canManage={canManage} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("clusterLevel")}</h2>
        <ClusterEditor data={data} canManage={canManage} />
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("orgChart")}</h2>
        <div className="flex flex-wrap gap-2">
          {stations.map((s) => (
            <button
              key={s.id}
              onClick={() => setOrgChartStationId(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-body border transition ${orgChartStationId === s.id ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              {s.name}
            </button>
          ))}
        </div>
        {orgChartStation && <HROrgChart station={orgChartStation} data={data} canManage={canManage} />}
      </section>
    </div>
  );
}