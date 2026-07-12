import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const STATUS_STYLE = {
  present: "bg-emerald-100 text-emerald-700 border-emerald-300",
  late: "bg-amber-100 text-amber-700 border-amber-300",
  absent: "bg-red-100 text-red-700 border-red-300",
  off_day: "bg-muted text-muted-foreground border-border",
  not_yet: "bg-muted text-muted-foreground border-border",
};

// Manager-facing daily attendance table — merges the visible employee roster (local
// data) with today's attendance rows (Supabase) so unrecorded employees still show up.
export default function AttendanceDailyDashboard({ employees, currentUser, t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!employees.length) { setRows([]); setLoading(false); return; }
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees.map((e) => e.id).join(",")]);

  const toggleExcuse = async (r) => {
    try {
      const res = await base44.functions.invoke("supabaseAttendance", {
        action: "excuseAttendance",
        userRole: currentUser?.role,
        attendanceId: r.id,
        managerId: currentUser?.id,
        managerName: currentUser?.name,
        excused: !r.excused,
      });
      const updated = res?.data?.attendance;
      if (updated) setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      // best-effort
    }
  };

  const byEmployee = Object.fromEntries(rows.map((r) => [r.employee_id, r]));
  const isPastCheckoutMissing = (r) => r?.check_in_at && !r?.check_out_at && r?.status !== "absent";

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
                <th className="py-2 pe-3 text-start"></th>
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_STYLE[status]}`}>
                          {status === "not_yet" ? t("attendanceStatusNotYet") : t(`attendanceStatus${status.charAt(0).toUpperCase()}${status.slice(1).replace(/_([a-z])/, (m, c) => c.toUpperCase())}`)}
                        </span>
                        {status === "late" && Number(r?.late_minutes) > 0 && (
                          <span className="text-[11px] text-amber-700">{t("lateBy")} {r.late_minutes} {t("minutesUnit")}</span>
                        )}
                        {r?.excused && <span className="text-[11px] text-emerald-700">{t("excused")}</span>}
                        {isPastCheckoutMissing(r) && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-red-300 bg-red-50 text-red-700">{t("missingCheckoutLabel")}</span>
                        )}
                        {r?.early_checkout && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-amber-300 bg-amber-50 text-amber-700">{t("earlyCheckoutLabel")}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : "—"}</td>
                    <td className="py-2 pe-3 text-muted-foreground">{r?.work_hours ?? "—"}</td>
                    <td className="py-2 pe-3">
                      {(status === "late" || status === "absent") && (
                        <button
                          onClick={() => toggleExcuse(r)}
                          className={`px-2 py-1 rounded-md text-xs font-body border transition ${r?.excused ? "border-border text-muted-foreground hover:bg-muted" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"}`}
                        >
                          {r?.excused ? t("unexcuseLate") : t("excuseLate")}
                        </button>
                      )}
                    </td>
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