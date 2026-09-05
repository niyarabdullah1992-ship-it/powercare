import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

export default function useAttendancePresence(employeeId) {
  const [attendance, setAttendance] = useState(null);

  useEffect(() => {
    if (!employeeId) return;
    let active = true;
    const load = () => base44.functions.invoke("supabaseAttendance", { action: "getTodayStatus", employeeId })
      .then((res) => { if (active) setAttendance(res?.data?.attendance || null); })
      .catch(() => { if (active) setAttendance(null); });
    load();
    const refresh = () => load();
    window.addEventListener("attendance-updated", refresh);
    return () => { active = false; window.removeEventListener("attendance-updated", refresh); };
  }, [employeeId]);

  return attendance;
}