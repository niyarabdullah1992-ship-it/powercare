import React, { useState } from "react";
import { useAuth } from "@/lib/PowerCareAuth";
import { updateCompany } from "@/lib/store";
import { canManageStations } from "@/lib/permissions";
import StationLocationEditor from "@/components/stations/StationLocationEditor";
import { MapPin, CheckCircle2, AlertTriangle } from "lucide-react";

// Manager panel inside Attendance Settings — set each station's workplace GPS
// location and allowed radius. Check-ins are verified against these coordinates.
export default function AttendanceLocationsPanel({ company, currentUser, t }) {
  const { data } = useAuth();
  const [editingId, setEditingId] = useState(null);

  if (!data) return null;

  // Full managers see every station; a station manager sees only their own.
  const stations = canManageStations(currentUser, data)
    ? data.stations
    : data.stations.filter((s) => s.managerId === currentUser.id || currentUser.stationId === s.id);

  const saveLocation = (id, coords) => {
    updateCompany(company.id, (d) => {
      const s = d.stations.find((x) => x.id === id);
      if (s) { s.lat = coords.lat; s.lng = coords.lng; s.radiusMeters = coords.radiusMeters; }
    });
    setEditingId(null);
  };

  if (stations.length === 0) return null;

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <div>
        <h3 className="font-heading text-lg font-semibold flex items-center gap-2">
          <MapPin className="w-4 h-4" /> {t("workplaceLocations")}
        </h3>
        <p className="text-xs text-muted-foreground font-body mt-1">{t("workplaceLocationsNote")}</p>
      </div>

      <div className="space-y-3">
        {stations.map((s) => {
          const hasLocation = s.lat != null && s.lng != null;
          return (
            <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-body text-sm font-medium" dir="auto">{s.name}</span>
                  {hasLocation ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-300 text-[11px] font-body text-emerald-700">
                      <CheckCircle2 className="w-3 h-3" /> {t("locationSet")} · {s.radiusMeters || 200}{t("metersUnit")}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-body text-amber-700">
                      <AlertTriangle className="w-3 h-3" /> {t("locationNotSet")}
                    </span>
                  )}
                </div>
                {editingId !== s.id && (
                  <button
                    onClick={() => setEditingId(s.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted"
                  >
                    <MapPin className="w-3.5 h-3.5" /> {hasLocation ? t("editLocation") : t("setLocation")}
                  </button>
                )}
              </div>
              {editingId === s.id && (
                <StationLocationEditor
                  t={t}
                  station={s}
                  onSave={(coords) => saveLocation(s.id, coords)}
                  onCancel={() => setEditingId(null)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}