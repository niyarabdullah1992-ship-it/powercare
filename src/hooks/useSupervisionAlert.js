import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { useAuth } from "@/lib/PowerCareAuth";
import { buildSupervisionModel } from "@/lib/supervisionModel";

// Priority is bought with a signal, not with a position: the supervision tab only
// lights up when a supervisor's rejection rate deviates from peers, an objection was
// overturned against them, or a station's weight load is imbalanced.
export default function useSupervisionAlert(enabled) {
  const { data, currentUser, company } = useAuth();
  const [alert, setAlert] = useState(false);

  useEffect(() => {
    if (!enabled || !currentUser || !company) return;
    let active = true;
    base44.functions.invoke("supabaseTargets", {
      action: "listTargets",
      companyId: company.id,
      userId: currentUser.id,
      sessionToken: getCompanyToken(company.id),
      userRole: currentUser.role,
      stationId: currentUser.stationId || null,
      managedStations: currentUser.managedStations || [],
    }).then((res) => {
      if (!active) return;
      const model = buildSupervisionModel(res.data.targets || [], data);
      const deviating = model.supervisors.some(
        (s) => s.rejections + s.approvals >= 3 && s.rejectionRate > model.peerAvgRejection + 0.15
      );
      const overturned = model.supervisors.some((s) => s.overturned > 0);
      const imbalanced = model.stations.some((s) => s.imbalanced);
      setAlert(deviating || overturned || imbalanced);
    }).catch(() => setAlert(false));
    return () => { active = false; };
  }, [enabled, currentUser?.id, company?.id, data]);

  return alert;
}