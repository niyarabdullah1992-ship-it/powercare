import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import StationDailyBoard from "@/components/reports/StationDailyBoard";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import ErpSectionFrame from "@/components/erp/ErpSectionFrame";
import { erpKicker } from "@/lib/erpModuleMeta";

/** Platform daily surface — StationDailyBoard only (L2342–2402). */
export default function DailyReport() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  const stationScope = useStationScope();
  const ar = lang === "ar";
  if (!data || !currentUser) return null;

  const reports = data?.reports || [];
  const pending = reports.filter((r) => r.status === "pending").length;

  return (
    <PlatformStampShell
      ar={ar}
      kicker={erpKicker("/app/daily-report", lang)}
      title={ar ? "التقرير اليومي" : "Daily report"}
      hint={ar
        ? "تقرير الفرع اليومي يغذي الاعتماد والأداء — حلقة بعد المهام والحضور."
        : "The station daily report feeds approval and performance — after tasks and attendance."}
    >
      <ErpSectionFrame
        path="/app/daily-report"
        ar={ar}
        stats={[
          { label: ar ? "تقارير مسجّلة" : "Filed reports", value: reports.length },
          { label: ar ? "بانتظار الاعتماد" : "Awaiting approval", value: pending, tone: pending > 0 ? "warn" : "ok" },
          { label: ar ? "الفروع" : "Stations", value: data?.stations?.length || 0 },
        ]}
      >
        <StationDailyBoard lang={lang} stationScope={stationScope} />
      </ErpSectionFrame>
    </PlatformStampShell>
  );
}
