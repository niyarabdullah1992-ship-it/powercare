import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";

// Shared fetch of the current user's tasks (targets) so the planner, calendar,
// journal and attendance sections can all show the same task data.
export default function usePersonalTargets() {
  const { currentUser } = useAuth();
  const [targets, setTargets] = useState([]);

  useEffect(() => {
    if (!currentUser) return;
    let alive = true;
    base44.functions
      .invoke("supabaseTargets", {
        action: "listTargets",
        userRole: currentUser.role,
        userId: currentUser.id,
        stationId: currentUser.stationId || null,
        managedStations: currentUser.managedStations || [],
      })
      .then((res) => { if (alive) setTargets(res.data?.targets || []); })
      .catch(() => { if (alive) setTargets([]); });
    return () => { alive = false; };
  }, [currentUser?.id]);

  return targets;
}