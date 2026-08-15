import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PerfScoreBoard from "@/components/performance/PerfScoreBoard";
import JobObjectiveBoard from "@/components/performance/JobObjectiveBoard";
import usePerformanceTargets from "@/hooks/usePerformanceTargets";
import { syncPointsFromCloud } from "@/lib/store";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/** Platform performance — PerfScoreBoard primary (L1528+). Extra tabs removed from main surface. */
export default function Performance() {
  const { lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const targets = usePerformanceTargets(company, currentUser);

  useEffect(() => {
    if (!company?.id) return;
    syncPointsFromCloud(company.id).then((ok) => { if (ok) refresh?.(); }).catch(() => {});
  }, [company?.id]);

  if (!data || !currentUser) return null;

  const scopedTargets = targets || [];
  const completedCount = scopedTargets.filter((tg) => tg.status === "completed").length;
  const overallPct = scopedTargets.length ? Math.round((completedCount / scopedTargets.length) * 100) : 0;

  return (
    <PlatformStampShell
      ar={lang === "ar"}
      title={lang === "ar" ? "الأداء" : "Performance"}
      hint={lang === "ar" ? "يُحسب من المهام المعتمدة. قارن الأفراد أو الفروع من نفس الصيغة." : "Scored from approved tasks. Compare people or stations on the same formula."}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PerfScoreBoard lang={lang} overallPct={overallPct} />
      <JobObjectiveBoard lang={lang} />
      </div>
    </PlatformStampShell>
  );
}
