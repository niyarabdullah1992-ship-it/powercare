import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, FileBarChart2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import { updateSafetyRecord, recordSafetyIncident } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import StationSafetyCard from "@/components/safety/StationSafetyCard";

// HSE management section: safety data is entered and approved per station here,
// then the HSE reports (inside Comprehensive Reports) are calculated from it.
export default function Safety() {
  const { lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const ar = lang === "ar";

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const canEdit = ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role) || data.ownerId === currentUser.id;
  const recFor = (sid) => (data.safety || []).find((s) => s.stationId === sid) || null;

  // Any data edit invalidates the previous approval — the report must reflect approved data only.
  const handleUpdate = (stationId, updates) =>
    updateSafetyRecord(company.id, stationId, { ...updates, approvedBy: null, approvedAt: null });

  const handleApprove = (stationId) =>
    updateSafetyRecord(company.id, stationId, { approvedBy: currentUser.name, approvedAt: new Date().toISOString() });

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "السلامة (HSE)" : "Safety (HSE)"}
        description={ar ? "أدخل بيانات السلامة لكل محطة واعتمدها — تُحسب تقارير السلامة الشهرية من البيانات المعتمدة هنا." : "Enter and approve each station's safety data — monthly HSE reports are calculated from the approved data here."}
        icon={ShieldCheck}
      />

      <Link to="/app/reports" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
        <FileBarChart2 className="w-3.5 h-3.5" />
        {ar ? "عرض تقارير السلامة ضمن التقارير الشاملة" : "View HSE reports in Comprehensive Reports"}
      </Link>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stations.map((station) => (
          <StationSafetyCard
            key={station.id}
            station={station}
            rec={recFor(station.id)}
            canEdit={canEdit}
            lang={lang}
            onUpdate={(updates) => handleUpdate(station.id, updates)}
            onApprove={() => handleApprove(station.id)}
            onIncident={(desc) => recordSafetyIncident(company.id, station.id, desc)}
          />
        ))}
      </div>
      {stations.length === 0 && (
        <p className="text-sm text-muted-foreground font-body text-center py-8">{ar ? "لا توجد محطات بعد — أضف محطة أولًا." : "No stations yet — add a station first."}</p>
      )}
    </div>
  );
}