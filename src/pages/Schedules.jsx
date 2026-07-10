import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canManageSchedule } from "@/lib/permissions";
import { ArrowLeft, CalendarClock } from "lucide-react";
import StationScheduleEditor from "@/components/schedules/StationScheduleEditor";

export default function Schedules() {
  const { t } = useI18n();
  const { data, company, currentUser } = useAuth();
  const [selectedStation, setSelectedStation] = useState(null);

  if (!data || !currentUser) return null;
  const stations = visibleStations(currentUser, data);

  if (!selectedStation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{t("schedules")}</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">{t("manageScheduleNote")}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stations.map((s) => (
            <button key={s.id} onClick={() => setSelectedStation(s.id)} className="text-start p-5 rounded-xl border border-border bg-card hover:border-accent transition-colors space-y-2">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-semibold">{s.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">{t("weeklySchedule")}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const station = data.stations.find((s) => s.id === selectedStation);
  const canManage = canManageSchedule(currentUser, data, selectedStation);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelectedStation(null)} className="p-2 rounded-md hover:bg-muted">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-heading text-3xl font-semibold">{station?.name}</h1>
          <p className="text-muted-foreground font-body text-sm">{t("weeklySchedule")}</p>
        </div>
      </div>
      <StationScheduleEditor companyId={company.id} stationId={selectedStation} canManage={canManage} />
    </div>
  );
}