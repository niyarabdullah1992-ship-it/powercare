import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Lightbulb, Megaphone, ShieldQuestion, Archive } from "lucide-react";
import AnonymousReports from "./AnonymousReports";
import PublicComplaints from "./PublicComplaints";
import RecordSmartArchive from "@/components/shared/RecordSmartArchive";
import ComplaintQueueBoard from "@/components/complaints/ComplaintQueueBoard";
import { hasHRPermission, hrScopeStations } from "@/lib/permissions";
import useStationScope, { matchesStationScope } from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { voiceKind } from "@/lib/complaintDerivations";

export default function Complaints() {
  const { t, lang, dir } = useI18n();
  const { data, currentUser } = useAuth();
  const [tab, setTab] = useState("suggestions");
  const ar = lang === "ar";
  const headerScope = useStationScope();

  const hasComplaintAccess = currentUser && (hasHRPermission(currentUser, data, "view_anonymous_reports") || hasHRPermission(currentUser, data, "manage_anonymous_reports"));
  const isManager = currentUser && (["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role) || hasComplaintAccess || data?.ownerId === currentUser.id);
  const fullScope = currentUser && (["director", "ops_manager"].includes(currentUser.role) || data?.ownerId === currentUser.id);
  const scopedStations = hasComplaintAccess ? hrScopeStations(currentUser, data) : currentUser?.role === "pgm" ? (currentUser.managedStations || []) : currentUser?.role === "station_manager" ? (currentUser.managedStations?.length ? currentUser.managedStations : [currentUser.stationId]) : [];
  const canSeeReport = (report) =>
    matchesStationScope(report.stationId, headerScope)
    && (fullScope || scopedStations === null || (report.stationId && scopedStations.includes(report.stationId)));

  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || (ar ? "المقر" : "HQ");

  const voiceBadge = (report, fallback) => {
    const kind = voiceKind(report);
    if (kind === "suggestion") return t("suggestion");
    if (kind === "anonymous") return t("anonymous");
    return fallback;
  };

  const archiveItems = isManager
    ? [
        ...(data?.anonymousReports || []).filter(canSeeReport).map((r) => ({
          id: "an_" + r.id, date: r.createdAt, title: stationName(r.stationId),
          text: r.confidential && r.confidentialBy !== currentUser.id ? t("confidentialHidden") : r.message,
          badge: voiceBadge(r, t("anonymous")),
        })),
        ...(data?.publicReports || []).filter(canSeeReport).map((r) => ({
          id: "pu_" + r.id, date: r.createdAt, title: stationName(r.stationId),
          text: r.message, badge: voiceBadge(r, t("complaint")),
        })),
      ]
    : [];

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "صوت الموظف" : "Employee Voice"}
      hint={ar
        ? "ثلاث قنوات لصوت واحد: اقتراح للتحسين، شكوى للمعالجة، وبلاغ مجهول للحماية."
        : "Three channels, one voice: suggestions to improve, complaints to resolve, anonymous reports to protect."}
      sections={[
        { value: "suggestions", label: ar ? "الاقتراحات" : t("suggestion"), icon: Lightbulb },
        { value: "complaints", label: ar ? "الشكاوى" : t("complaint"), icon: Megaphone },
        { value: "anonymous", label: t("anonymous"), icon: ShieldQuestion },
        ...(isManager ? [{ value: "archive", label: ar ? "الأرشيف" : "Archive", icon: Archive }] : []),
      ]}
      tool={tab}
      onTool={setTab}
      maxWidth={1600}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {isManager && tab !== "archive" && (
          <ComplaintQueueBoard
            lang={lang}
            stationScope={headerScope}
            voice={tab === "suggestions" ? "suggestion" : tab === "anonymous" ? "anonymous" : "complaint"}
          />
        )}
        {tab === "suggestions" && <PublicComplaints lockedType="suggestion" underQueue={isManager} />}
        {tab === "complaints" && <PublicComplaints lockedType="complaint" underQueue={isManager} />}
        {tab === "anonymous" && <AnonymousReports underQueue={isManager} />}
        {tab === "archive" && isManager && (
          <RecordSmartArchive
            items={archiveItems}
            lang={lang}
            dir={dir}
            emptyLabel={ar ? "لا أصوات مؤرشفة في هذا النطاق." : "No archived employee voice items in this scope."}
          />
        )}
      </div>
    </PlatformStampShell>
  );
}
