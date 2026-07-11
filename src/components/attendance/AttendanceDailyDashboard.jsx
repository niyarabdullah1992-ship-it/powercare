import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const STATUS_STYLE = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  not_yet: "bg-muted text-muted-foreground border-border",
};

// Manager-facing daily attendance table — merges the visible employee roster (local
// data) with today's attendance rows (Supabase) so unrecorded employees still show up.
export default function AttendanceDailyDashboard({ employees, t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employees.length) { setRows([]); setLoading(false); return; }
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [employees.map((e) => e.id).join(",")]);

  const byEmployee = Object.fromEntries(rows.map((r) => [r.employee_id, r]));

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading text-lg font-semibold">{t("dailyAttendance")}</h3>
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pe-3 text-start">{t("employeeName")}</th>
                <th className="py-2 pe-3 text-start">{t("status")}</th>
                <th className="py-2 pe-3 text-start">{t("checkIn")}</th>
                <th className="py-2 pe-3 text-start">{t("checkOut")}</th>
                <th className="py-2 pe-3 text-start">{t("workHoursLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const r = byEmployee[e.id];
                const status = r?.status || "not_yet";
                return (
                  <tr key={e.id} className="border-b border-border/60">
                    <td className="py-2 pe-3">{e.name}</td>
                    <td className="py-2 pe-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[status]}`}>
                        {status === "not_yet" ? t("attendanceStatusNotYet") : t(`attendanceStatus${status.charAt(0).toUpperCase()}${status.slice(1)}`)}
                      </span>
                    </td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.work_hours ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}