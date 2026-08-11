import React, { useState } from "react";
import { ShieldCheck, FileText, ClipboardCheck, Archive } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations, canApproveReports } from "@/lib/permissions";
import { updateSafetyRecord, recordSafetyIncident, closeSafetyHazard, approveSafetyRecord, revokeSafetyApproval } from "@/lib/safetyStore";
import { safetyApprovalIssues } from "@/lib/safetyLogic";
import PageHeader from "@/components/PageHeader";
import StationSafetyCard from "@/components/safety/StationSafetyCard";
import SafetyReportExport from "@/components/safety/SafetyReportExport";
import SafetyExplanation from "@/components/safety/SafetyExplanation";
import SafetyDashboard from "@/components/safety/SafetyDashboard";
import SafetyIncidentReportForm from "@/components/safety/SafetyIncidentReportForm";
import HseRatesPanel from "@/components/safety/HseRatesPanel";
import { toast } from "@/components/ui/use-toast";
import RecordSmartArchive from "@/components/RecordSmartArchive";
import SectionToolbar from "@/components/shared/SectionToolbar";

// HSE management section: safety data is entered and approved per station here,
// then the HSE reports (inside Comprehensive Reports) are calculated from it.
export default function Safety() {
  const { lang, dir } = useI18n();
  const { data, currentUser, company } = useAuth();
  const ar = lang === "ar";
  const [tab, setTab] = useState("manage");
  const [showReport, setShowReport] = useState(false);

  if (!data || !currentUser) return null;

  const stations = visibleStations(currentUser, data);
  const isSafetyOfficer = currentUser.role === "safety_officer";
  const canEdit = ["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role) || isSafetyOfficer || data.ownerId === currentUser.id;
  const canCustomize = ["director", "ops_manager", "station_manager"].includes(currentUser.role) || isSafetyOfficer || data.ownerId === currentUser.id;
  const canApprove = canApproveReports(currentUser) || isSafetyOfficer || data.ownerId === currentUser.id;
  const reportStation = data.stations.find((station) => station.id === currentUser.stationId);
  const recFor = (sid) => (data.safety || []).find((s) => s.stationId === sid) || null;

  // Any data edit invalidates the previous approval — the report must reflect approved data only.
  const handleUpdate = (stationId, updates) => {
    // Adding a hazard while the station is "Safe" auto-downgrades it to "Watch".
    const rec = recFor(stationId);
    const extra = updates.hazards && updates.hazards.length > (rec?.hazards?.length || 0) && (updates.level || rec?.level || "green") === "green"
      ? { level: "amber" }
      : {};
    updateSafetyRecord(company.id, stationId, { ...updates, ...extra, approvedBy: null, approvedAt: null }, currentUser.name);
  };

  // Approval is committed only after the store re-validates every dependency.
  const handleApprove = (stationId) => {
    const result = approveSafetyRecord(company.id, stationId, currentUser.name);
    if (result && result.ok === false) {
      toast({ description: ar ? result.reason : (result.reasonEn || result.reason), variant: "destructive" });
      return false;
    }
    return true;
  };
  const handleRevokeApproval = (stationId) => revokeSafetyApproval(company.id, stationId, currentUser.name);
  const handleCloseHazard = (stationId, index, opts = {}) => {
    const result = closeSafetyHazard(company.id, stationId, index, currentUser.name, opts);
    if (result && result.ok === false) {
      toast({ description: ar ? result.reason : (result.reasonEn || result.reason), variant: "destructive" });
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "السلامة (HSE)" : "Safety (HSE)"}
        description={ar ? "أدخل بيانات السلامة لكل محطة واعتمدها — تُحسب تقارير السلامة الشهرية من البيانات المعتمدة هنا." : "Enter and approve each station's safety data — monthly HSE reports are calculated from the approved data here."}
        icon={ShieldCheck}
      />

      <SafetyExplanation ar={ar} />

      {!canEdit && reportStation && <SafetyIncidentReportForm station={reportStation} ar={ar} onSubmit={async (description) => { const saved = recordSafetyIncident(company.id, reportStation.id, description, currentUser.name); toast({ description: saved ? (ar ? "تم إرسال بلاغ السلامة." : "Safety report submitted.") : (ar ? "تم تسجيل البلاغ نفسه اليوم مسبقًا." : "This report was already submitted today."), variant: saved ? "default" : "destructive" }); return saved; }} />}

      {(canEdit || canApprove || data.ownerId === currentUser.id) && (
        <>
          <HseRatesPanel lang={lang} />
          <SafetyDashboard safety={data.safety || []} stations={stations} lang={lang} />
        </>
      )}

      <SectionToolbar
        tabs={[
          { key: "manage", icon: ClipboardCheck, label: ar ? "إدارة السلامة" : "Manage" },
          { key: "archive", icon: Archive, label: ar ? "الأرشيف الذكي" : "Smart Archive" },
        ]}
        activeTab={tab}
        onTabChange={setTab}
        actions={[{
          key: "report",
          icon: FileText,
          label: ar ? "تقرير السلامة (PDF / Excel)" : "Safety report (PDF / Excel)",
          active: showReport,
          onClick: () => setShowReport(!showReport),
        }]}
      />

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
          <div className="grid gap-4 lg:grid-cols-2">
            {stations.map((station) => (
              <StationSafetyCard
                key={station.id}
                station={station}
                rec={recFor(station.id)}
                canEdit={canEdit}
                canApprove={canApprove}
                canCustomize={canCustomize}
                approvalIssues={safetyApprovalIssues(recFor(station.id), ar)}
                lang={lang}
                signerName={currentUser.name}
                onUpdate={(updates) => handleUpdate(station.id, updates)}
                onDisabledTabsChange={(disabledTabs) => updateSafetyRecord(company.id, station.id, { disabledTabs }, currentUser.name)}
                onCloseHazard={(index, opts) => handleCloseHazard(station.id, index, opts)}
                onApprove={() => handleApprove(station.id)}
                onRevokeApproval={() => handleRevokeApproval(station.id)}
                onIncident={(desc) => {
                  // Duplicate guard: the exact same incident can't be logged twice on the same day.
                  const dup = (recFor(station.id)?.incidentLog || []).some(
                    (i) => (i.description || "") === desc && i.at && new Date(i.at).toDateString() === new Date().toDateString()
                  );
                  if (!dup) recordSafetyIncident(company.id, station.id, desc, currentUser.name);
                }}
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