import React, { useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PerfScoreBoard from "@/components/performance/PerfScoreBoard";
import JobObjectiveBoard from "@/components/performance/JobObjectiveBoard";
import usePerformanceTargets from "@/hooks/usePerformanceTargets";
import { syncPointsFromCloud } from "@/lib/store";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import ErpSectionFrame from "@/components/erp/ErpSectionFrame";
import { erpKicker } from "@/lib/erpModuleMeta";

/** Platform performance — scored from approved tasks only. */
export default function Performance() {
  const { lang } = useI18n();
  const { data, currentUser, company, refresh } = useAuth();
  const targets = usePerformanceTargets(company, currentUser);
  const ar = lang === "ar";

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
      ar={ar}
      kicker={erpKicker("/app/performance", lang)}
      title={ar ? "الأداء" : "Performance"}
      hint={ar
        ? "يُحسب من المهام المعتمدة فقط — بدون تقييم وهمي أو أهداف معزولة عن الإثبات."
        : "Scored from approved tasks only — no vanity scores or goals detached from proof."}
    >
      <ErpSectionFrame
        path="/app/performance"
        ar={ar}
        hideProof
        stats={[
          {
            label: ar ? "إنجاز الأهداف" : "Goal completion",
            value: `${overallPct}%`,
            hint: ar ? `${completedCount} من ${scopedTargets.length}` : `${completedCount} of ${scopedTargets.length}`,
            tone: overallPct >= 70 ? "ok" : overallPct >= 40 ? "warn" : null,
          },
          {
            label: ar ? "أهداف نشطة" : "Active goals",
            value: scopedTargets.length,
            hint: ar ? "مرتبطة بالمهام" : "Task-linked",
          },
          {
            label: ar ? "مصدر البيانات" : "Data source",
            value: ar ? "معتمد" : "Approved",
            hint: ar ? "مهام + اعتماد" : "Tasks + review",
            tone: "ok",
          },
        ]}
      >
        <PerfScoreBoard lang={lang} overallPct={overallPct} />
        <JobObjectiveBoard lang={lang} />
      </ErpSectionFrame>
    </PlatformStampShell>
  );
}
