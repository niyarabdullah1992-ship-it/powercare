import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useDirectoryTargets(currentUser) {
  const [targets, setTargets] = useState([]);
  useEffect(() => {
    if (!currentUser) return;
    let ignore = false;
    base44.functions.invoke("supabaseTargets", {
      action: "listTargets",
      userRole: currentUser.role,
      userId: currentUser.id,
      stationId: currentUser.stationId || null,
      managedStations: currentUser.managedStations || [],
    }).then((response) => { if (!ignore) setTargets(response?.data?.targets || []); }).catch(() => {});
    return () => { ignore = true; };
  }, [currentUser?.id]);
  return targets;
}