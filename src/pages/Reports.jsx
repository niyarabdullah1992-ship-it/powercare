import React from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import ReportLibraryBoard from "@/components/reports/ReportLibraryBoard";
import useStationScope from "@/hooks/useStationScope";

/** Platform `reports` — library & scheduled analytics (separate from daily station filing). */
export default function Reports() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  const stationScope = useStationScope();
  if (!data || !currentUser) return null;

  return <ReportLibraryBoard lang={lang} stationScope={stationScope} />;
}
