import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageHRLevels } from "@/lib/permissions";
import { updateCompany } from "@/lib/store";
import { buildHRLevels, tierName, tierNote } from "@/lib/hrLevels";
import HRTierCard from "@/components/hr/HRTierCard";
import ClusterEditor from "@/components/hr/ClusterEditor";

const HR_SCHEMA_VERSION = 4; // fixed 5-tier global hierarchy

export default function HR() {
  const { t, lang } = useI18n();
  const { data, currentUser } = useAuth();
  const canManage = data && currentUser && canManageHRLevels(currentUser);

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
  const clusters = data.hrClusters || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("globalHrHierarchy")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("tier")} 1 · {t("siteLevel")}</h2>
          <p className="text-xs text-muted-foreground font-body">{tierNote(1, lang)}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <HRTierCard key={s.id} tier={1} scopeType="station" scopeId={s.id} scopeName={s.name} data={data} canManage={canManage} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("tier")} 2 · {t("clusterLevel")}</h2>
          <p className="text-xs text-muted-foreground font-body">{tierNote(2, lang)}</p>
        </div>
        <ClusterEditor data={data} canManage={canManage} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clusters.map((c) => (
            <HRTierCard key={c.id} tier={2} scopeType="cluster" scopeId={c.id} scopeName={c.name} data={data} canManage={canManage} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">{t("companyLevel")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[3, 4, 5].map((tier) => (
            <div key={tier} className="space-y-1.5">
              <HRTierCard tier={tier} scopeType="company" scopeId={null} scopeName={`${t("tier")} ${tier} · ${tierName(tier, "manager", lang)}`} data={data} canManage={canManage} />
              <p className="text-[11px] text-muted-foreground font-body px-1">{tierNote(tier, lang)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}