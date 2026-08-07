import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { MapContainer, CircleMarker, Circle, Marker, Popup, useMap } from "react-leaflet";
import GoogleTiles from "@/components/maps/GoogleTiles";
import L from "leaflet";
import { Loader2, MapPin } from "lucide-react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";
import "leaflet/dist/leaflet.css";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import MobileSelect from "@/components/mobile/MobileSelect";

const stationIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Auto-fits the map to show every plotted point whenever they change.
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0], 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, JSON.stringify(points)]);
  return null;
}

function distanceMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(value)));
}

// Manager map dashboard — plots every check-in location for a chosen day against
// station locations/radii so managers can verify attendance data accuracy.
export default function AttendanceMapDashboard({ employees, t }) {
  const { data } = useAuth();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stationFilter, setStationFilter] = useState("all");

  useEffect(() => {
    if (employees.length === 0) return;
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id), date })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [date, employees.length]);

  const allStations = data?.stations || [];
  const defaultStationId = allStations[0]?.id || null;
  const located = rows.filter((r) => r.check_in_lat != null && r.check_in_lng != null)
    .map((r) => {
      const stationId = r.station_id || defaultStationId;
      const station = allStations.find((s) => s.id === stationId && s.lat != null && s.lng != null);
      const distance = station ? distanceMeters({ lat: Number(r.check_in_lat), lng: Number(r.check_in_lng) }, { lat: Number(station.lat), lng: Number(station.lng) }) : null;
      return { ...r, mapStationId: stationId, mapDistance: distance, mapInside: distance != null && distance <= (Number(station.radiusMeters) || 200) };
    })
    .filter((r) => stationFilter === "all" || r.mapStationId === stationFilter);
  const stations = allStations.filter((s) => s.lat != null && s.lng != null)
    .filter((s) => stationFilter === "all" || s.id === stationFilter);

  const points = [
    ...located.map((r) => [r.check_in_lat, r.check_in_lng]),
    ...stations.map((s) => [s.lat, s.lng]),
  ];
  const insideCount = located.filter((r) => r.mapInside).length;
  const outsideCount = located.length - insideCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-md border border-input text-sm font-body bg-card"
        />
        <MobileSelect value={stationFilter} onChange={setStationFilter} searchable searchPlaceholder={t("search")} placeholder={t("all")} className="min-w-52" options={[{ value: "all", label: t("all") }, ...(data?.stations || []).map((station) => ({ value: station.id, label: station.location ? `${station.name} — ${station.location}` : station.name }))]} />
        {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        <ComparisonExportButtons
          title={`${t("mapTab")} — ${date}`}
          headers={[t("employeeName"), t("checkIn"), t("locationStatus"), t("distanceMeters"), "Latitude", "Longitude"]}
          rows={located.map((r) => [r.employee_name || r.employee_id, r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—", r.mapInside ? t("insideLocation") : t("outsideLocation"), r.mapDistance ?? "—", r.check_in_lat, r.check_in_lng])}
        />
        <div className="flex items-center gap-3 text-xs font-body ms-auto">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500" /> {t("insideLocation")} ({insideCount})</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> {t("outsideLocation")} ({outsideCount})</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {t("stationLocation")}</span>
        </div>
      </div>

      {located.length === 0 && stations.length === 0 ? (
        <div className="p-8 rounded-xl border border-border bg-card text-center text-sm text-muted-foreground font-body">
          {t("noMapData")}
        </div>
      ) : (
        <div className="h-[480px] rounded-xl border border-border overflow-hidden relative">
          <MapContainer center={points[0] || [24.7, 46.7]} zoom={12} style={{ height: "100%", width: "100%" }}>
            <GoogleTiles />
            <FitBounds points={points} />
            {stations.map((s) => {
              const stationRows = located.filter((r) => r.mapStationId === s.id);
              const zoneColor = stationRows.length === 0 ? "#b8860b" : stationRows.every((r) => r.mapInside) ? "#059669" : "#dc2626";
              return (
                <React.Fragment key={s.id}>
                  <Marker position={[s.lat, s.lng]} icon={stationIcon}>
                    <Popup><span dir="auto">{s.name}</span></Popup>
                  </Marker>
                  {s.radiusMeters != null && (
                    <Circle center={[s.lat, s.lng]} radius={s.radiusMeters} pathOptions={{ color: zoneColor, fillColor: zoneColor, fillOpacity: 0.08, weight: 2 }} />
                  )}
                </React.Fragment>
              );
            })}
            {located.map((r) => (
              <CircleMarker
                key={r.id}
                center={[r.check_in_lat, r.check_in_lng]}
                radius={9}
                pathOptions={{
                  color: r.mapInside ? "#059669" : "#dc2626",
                  fillColor: r.mapInside ? "#10b981" : "#ef4444",
                  fillOpacity: 0.85,
                  weight: 2,
                }}
              >
                <Popup>
                  <div className="text-xs space-y-0.5" dir="auto">
                    <EmployeeNameLink employeeId={r.employee_id} employeeName={r.employee_name || r.employee_id} className="font-semibold" />
                    <p>{t("checkedInAt")} {r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</p>
                    {r.mapDistance != null && <p>{t("distanceMeters")}: {r.mapDistance}m</p>}
                    <p className={r.mapInside ? "text-emerald-700" : "text-red-700"}>
                      {r.mapInside ? t("insideLocation") : t("outsideLocation")}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      )}

      {rows.length > 0 && located.length === 0 && (
        <p className="text-xs text-muted-foreground font-body">{t("noLocatedCheckins")}</p>
      )}
    </div>
  );
}