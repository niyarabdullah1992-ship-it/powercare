import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { getCompanyToken } from "@/lib/store";

function lastMonths(n) {
  const out = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// Monthly attendance rate and late counts for the last N months.
export default function useMonthlyAttendance(company, employees, months = 6) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeIds = (employees || []).map((e) => e.id);

  useEffect(() => {
    let active = true;
    const list = lastMonths(months);
    const auth = { companyId: company.id, sessionToken: getCompanyToken(company.id) };

    (async () => {
      const stats = await Promise.all(
        list.map((month) =>
          employeeIds.length
            ? base44.functions
                .invoke("supabaseAttendance", { action: "getAnalytics", employeeIds, month, ...auth })
                .then((res) => res?.data?.stats || [])
                .catch(() => [])
            : Promise.resolve([])
        )
      );
      if (!active) return;
      setRows(list.map((month, i) => {
        const rated = stats[i].filter((s) => s.attendanceRate != null);
        return {
          month,
          avgRate: rated.length ? Math.round((rated.reduce((sum, s) => sum + s.attendanceRate, 0) / rated.length) * 10) / 10 : null,
          lateCount: stats[i].reduce((sum, s) => sum + (s.late || 0) + (s.excusedLate || 0), 0),
        };
      }));
      setLoading(false);
    })();
    return () => { active = false; };
  }, [company.id, employeeIds.join(","), months]);

  return { rows, loading };
}