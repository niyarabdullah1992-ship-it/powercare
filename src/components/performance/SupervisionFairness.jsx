import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { buildSupervisionModel } from "@/lib/supervisionModel";
import { Loader2 } from "lucide-react";
import SupervisorMetricsTable from "@/components/performance/SupervisorMetricsTable";
import DistributionFairnessPanel from "@/components/performance/DistributionFairnessPanel";

// «الدليل قبل الحكم» يشمل المشرف أيضاً: مؤشراته وعدالة توزيعه دليلٌ قابل للتدقيق.
export default function SupervisionFairness() {
  const { lang } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [targets, setTargets] = useState(null);

  useEffect(() => {
    if (!currentUser || !company) return;
    base44.functions.invoke("supabaseTargets", {
      action: "listTargets",
      companyId: company.id,
      userId: currentUser.id,
      sessionToken: getCompanyToken(company.id),
      userRole: currentUser.role,
      stationId: currentUser.stationId || null,
      managedStations: currentUser.managedStations || [],
    }).then((res) => setTargets(res.data.targets || [])).catch(() => setTargets([]));
  }, [currentUser?.id, company?.id]);

  const model = useMemo(() => buildSupervisionModel(targets || [], data), [targets, data]);

  if (!targets) {
    return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      <SupervisorMetricsTable model={model} lang={lang} />
      <DistributionFairnessPanel model={model} lang={lang} />
    </div>
  );
}