import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import StationDailyBoard from "@/components/reports/StationDailyBoard";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/** Platform daily surface — StationDailyBoard only (L2342–2402). */
export default function DailyReport() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  const stationScope = useStationScope();
  if (!data || !currentUser) return null;
  return (
    <PlatformStampShell
      ar={lang === "ar"}
      title={lang === "ar" ? "التقرير اليومي" : "Daily report"}
      hint={lang === "ar" ? "تقرير الفرع اليومي يغذي الاعتماد والأداء." : "The station daily report feeds approval and performance."}
    >
      <StationDailyBoard lang={lang} stationScope={stationScope} />
    </PlatformStampShell>
  );
}
