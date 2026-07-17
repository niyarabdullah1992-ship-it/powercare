import React, { useState } from "react";
import { ShieldCheck, FileText, ClipboardCheck, Archive } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canSeeAllStations } from "@/lib/permissions";
import { updateSafetyRecord, recordSafetyIncident } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import StationSafetyCard from "@/components/safety/StationSafetyCard";
import SafetyReportExport from "@/components/safety/SafetyReportExport";
import RecordSmartArchive from "@/components/RecordSmartArchive";

// HSE management section: safety data is entered and approved per station here,
// then the HSE reports (inside Comprehensive Reports) are calculated from it.
export default function Safety() {
  const { lang, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const ar = lang === "ar";
  const [tab, setTab] = useState("manage");
  const [showReport, setShowReport] = useState(false);

  if (!data || !currentUser) return null;

  // HQ (المقر الرئيسي) gets its own safety card alongside the stations.
  const stations = [
    ...(canSeeAllStations(currentUser) || !currentUser.stationId
      ? [{ id: "hq", name: ar ? "المقر الرئيسي" : "Headquarters" }]
      : []),
    ...visibleStations(currentUser, data),
  ];
  const canEdit = ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role) || data.ownerId === currentUser.id;
  const recFor = (sid) => (data.safety || []).find((s) => s.stationId === sid) || null;

  // Any data edit invalidates the previous approval — the report must reflect approved data only.
  const handleUpdate = (stationId, updates) => {
    // Adding a hazard while the station is "Safe" auto-downgrades it to "Watch".
    const rec = recFor(stationId);
    const extra = updates.hazards && updates.hazards.length > (rec?.hazards?.length || 0) && (updates.level || rec?.level || "green") === "green"
      ? { level: "amber" }
      : {};
    updateSafetyRecord(company.id, stationId, { ...updates, ...extra, approvedBy: null, approvedAt: null });
  };

  // Approval also clears the incident lock: once management reviews and approves
  // the data after an incident, the "Safe" level becomes selectable again.
  const handleApprove = (stationId) => {
    const at = new Date().toISOString();
    const rec = recFor(stationId);
    // Every approval is saved permanently in the station's approval log.
    const approvalLog = [{ by: currentUser.name, at }, ...(rec?.approvalLog || [])];
    updateSafetyRecord(company.id, stationId, { approvedBy: currentUser.name, approvedAt: at, incidentClearedAt: at, approvalLog });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "السلامة (HSE)" : "Safety (HSE)"}
        description={ar ? "أدخل بيانات السلامة لكل محطة واعتمدها — تُحسب تقارير السلامة الشهرية من البيانات المعتمدة هنا." : "Enter and approve each station's safety data — monthly HSE reports are calculated from the approved data here."}
        icon={ShieldCheck}
      />

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          {[
            { key: "manage", icon: ClipboardCheck, label: ar ? "إدارة السلامة" : "Manage" },
            { key: "archive", icon: Archive, label: ar ? "الأرشيف الذكي" : "Smart Archive" },
          ].map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${tab === tb.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              <tb.icon className="w-3.5 h-3.5" /> {tb.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setShowReport(!showReport)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${showReport ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
        >
          <FileText className="w-3.5 h-3.5" />
          {ar ? "تقرير السلامة (PDF / Excel)" : "Safety report (PDF / Excel)"}
        </button>
      </div>

      {showReport && (
        <SafetyReportExport stations={stations} safety={data.safety || []} data={data} t={(k) => k} lang={lang} dir={dir} />
      )}

      {tab === "archive" ? (
        // Smart archive — every logged safety incident, filed under Year → Month folders.
        <RecordSmartArchive
          items={stations.flatMap((station) =>
            ((recFor(station.id)?.incidentLog) || []).map((i, idx) => ({
              id: `${station.id}_${i.at || idx}`,
              date: i.at,
              title: station.name,
              text: i.description || "",
              badge: ar ? "حادث" : "Incident",
            }))
          )}
          lang={lang}
          dir={dir}
          emptyLabel={ar ? "لا توجد حوادث مؤرشفة — يُؤرشف كل حادث تلقائيًا حسب شهره." : "No archived incidents — each incident is auto-filed by its month."}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}