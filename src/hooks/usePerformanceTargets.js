import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

// Scope-filtered targets for the performance header figures and the supervision
// alert dot. The backend already limits rows to what this user may see.
export default function usePerformanceTargets(company, currentUser) {
  const [targets, setTargets] = useState(null);

  useEffect(() => {
    if (!currentUser || !company) return;
    let alive = true;
    base44.functions
      .invoke("supabaseTargets", {
        action: "listTargets",
        companyId: company.id,
        userId: currentUser.id,
        sessionToken: getCompanyToken(company.id),
        userRole: currentUser.role,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      })
      .then((res) => { if (alive) setTargets(res.data.targets || []); })
      .catch(() => { if (alive) setTargets([]); });
    return () => { alive = false; };
  }, [currentUser?.id, company?.id]);

  return targets;
}