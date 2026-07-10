import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { canManageHRLevels, canAssignMultiStation, visibleStations } from "@/lib/permissions";
import { Building2, ChevronRight, ArrowLeft } from "lucide-react";
import ClusterEditor from "@/components/hr/ClusterEditor";
import HRTiersEditor from "@/components/hr/HRTiersEditor";
import HROrgChart from "@/components/hr/HROrgChart";

export default function HR() {
  const { t, dir } = useI18n();
  const { data, currentUser } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);
  const canManage = data && currentUser && canManageHRLevels(currentUser, data);
  const canMultiStation = data && currentUser && canAssignMultiStation(currentUser, data);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const station = stations.find((s) => s.id === selectedStation);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {stations.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStation(s.id)}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted transition text-start"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-md bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-sm font-medium font-body">{s.name}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-muted-foreground ${dir === "rtl" ? "rotate-180" : ""}`} />
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <button onClick={() => setSelectedStation(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground font-body hover:text-foreground">
              <ArrowLeft className={`w-4 h-4 ${dir === "rtl" ? "rotate-180" : ""}`} /> {t("back")}
            </button>
            {station && <HROrgChart station={station} data={data} canManage={canManage} />}
          </div>
        )}
      </section>
    </div>
  );
}