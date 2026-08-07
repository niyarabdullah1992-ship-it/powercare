import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";
import { getTodayAttendance } from "@/lib/attendance";

// أرقام حيّة لموظف واحد: مهامه المفتوحة وحالة حضوره اليوم.
export default function useEmployeeProfileMetrics(company, currentUser, employeeId) {
  const [metrics, setMetrics] = useState({ openTasks: null, todayAttendance: null });

  useEffect(() => {
    if (!company || !currentUser || !employeeId) return;
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
      .then((res) => {
        if (!alive) return;
        const mine = (res.data?.targets || []).filter((target) => target.employee_id === employeeId);
        setMetrics((current) => ({
          ...current,
          openTasks: mine.filter((target) => ["active", "pending_review"].includes(target.status)).length,
        }));
      })
      .catch(() => alive && setMetrics((current) => ({ ...current, openTasks: 0 })));

    getTodayAttendance(employeeId).then((attendance) => { if (alive) setMetrics((current) => ({ ...current, todayAttendance: attendance })); });

    return () => { alive = false; };
  }, [company?.id, currentUser?.id, employeeId]);

  return metrics;
}