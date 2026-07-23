import React, { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { canManageHRLevels, canAssignMultiStation, canManageStations, visibleStations } from "@/lib/permissions";
import { Building2, ArrowLeft } from "lucide-react";
import ClusterEditor from "@/components/hr/ClusterEditor";
import HRTiersEditor from "@/components/hr/HRTiersEditor";
import HROrgChart from "@/components/hr/HROrgChart";
import HRFullHierarchyMap from "@/components/hr/HRFullHierarchyMap";
import EscalationInfoBox from "@/components/escalation/EscalationInfoBox";
import GradeEmployeeFilter from "@/components/hr/GradeEmployeeFilter";
import HROrgTree from "@/components/hr/HROrgTree";

export default function HRStructureManagement() {
  const { t, dir, lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);
  const canMultiStation = data && currentUser && canAssignMultiStation(currentUser, data);

  useEffect(() => {
    if (!data || !currentUser) return;
    if (selectedStation && !visibleStations(currentUser, data).some((station) => station.id === selectedStation)) setSelectedStation(null);
  }, [data?.stations, currentUser, selectedStation]);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const station = stations.find((s) => s.id === selectedStation);

  // Drag-and-drop reordering of the station cards (reorders the underlying station list).
  const canReorderStations = canManageStations(currentUser);
  const handleStationDragEnd = (result) => {
    if (!result.destination || !canReorderStations) return;
    const ids = stations.map((s) => s.id);
    const reordered = Array.from(ids);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    updateCompany(company.id, (d) => {
      const byId = Object.fromEntries(d.stations.map((s) => [s.id, s]));
      const positions = [];
      d.stations.forEach((s, i) => { if (ids.includes(s.id)) positions.push(i); });
      const next = [...d.stations];
      positions.forEach((pos, idx) => { next[pos] = byId[reordered[idx]]; });
      d.stations = next;
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("hr")}</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">{t("hrPageNote")}</p>
      </div>

      <HROrgTree data={data} company={company} currentUser={currentUser} lang={lang} />

      <EscalationInfoBox t={t} />
      <GradeEmployeeFilter data={data} currentUser={currentUser} />

      {canManage && (
        <div className="p-3.5 rounded-xl border border-accent/30 bg-accent/5">
          <p className="text-xs text-muted-foreground font-body">{t("clusterManagerNote")}</p>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-lg font-semibold">{t("clusterLevel")}</h2>
        <ClusterEditor data={data} canManage={canManage} myStationId={currentUser.stationId} />
      </section>

      {canManage && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold">{t("hrLevels")}</h2>
          <HRTiersEditor data={data} canManage={canManage} canMultiStation={canMultiStation} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4" /> {t("orgChart")}
        </h2>

        {!selectedStation ? (
          stations.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body">{t("noTasks")}</p>
          ) : (
            <HRFullHierarchyMap
              data={data}
              company={company}
              currentUser={currentUser}
              stations={stations}
              t={t}
              lang={lang}
              onSelectStation={setSelectedStation}
              canReorder={canReorderStations}
              onStationDragEnd={handleStationDragEnd}
            />
          )
        ) : (
          <div className="space-y-3">
            <button onClick={() => setSelectedStation(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
            </button>
            {station && <HROrgChart station={station} data={data} canManage={canManage} company={company} />}
          </div>
        )}
      </section>
    </div>
  );
}