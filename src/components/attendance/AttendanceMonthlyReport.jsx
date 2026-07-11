import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Monthly per-employee attendance report with present/late/absent/hours totals.
export default function AttendanceMonthlyReport({ employees, defaultEmployeeId, t }) {
  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || employees[0]?.id || "");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId || !month) return;
    setLoading(true);
    base44.functions.invoke("supabaseAttendance", { action: "listMonthly", employeeId, month })
      .then((res) => setRows(res?.data?.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [employeeId, month]);

  const totals = rows.reduce(
    (acc, r) => {
      if (r.status === "present") acc.present++;
      else if (r.status === "late") acc.late++;
      else if (r.status === "absent") acc.absent++;
      acc.hours += Number(r.work_hours) || 0;
      return acc;
    },
    { present: 0, late: 0, absent: 0, hours: 0 }
  );

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-4">
      <h3 className="font-heading text-lg font-semibold">{t("monthlyAttendanceReport")}</h3>
      <div className="flex flex-wrap gap-3">
        <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body bg-card">
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg border border-emerald-300 bg-emerald-50 text-center">
          <p className="text-lg font-semibold text-emerald-700">{totals.present}</p>
          <p className="text-[11px] text-emerald-700 font-body">{t("totalPresent")}</p>
        </div>
        <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-center">
          <p className="text-lg font-semibold text-amber-700">{totals.late}</p>
          <p className="text-[11px] text-amber-700 font-body">{t("totalLate")}</p>
        </div>
        <div className="p-3 rounded-lg border border-red-300 bg-red-50 text-center">
          <p className="text-lg font-semibold text-red-700">{totals.absent}</p>
          <p className="text-[11px] text-red-700 font-body">{t("totalAbsent")}</p>
        </div>
        <div className="p-3 rounded-lg border border-border bg-muted text-center">
          <p className="text-lg font-semibold">{totals.hours.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground font-body">{t("totalWorkHours")}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="text-start text-xs text-muted-foreground border-b border-border">
                <th className="py-2 pe-3 text-start">{t("date")}</th>
                <th className="py-2 pe-3 text-start">{t("status")}</th>
                <th className="py-2 pe-3 text-start">{t("checkIn")}</th>
                <th className="py-2 pe-3 text-start">{t("checkOut")}</th>
                <th className="py-2 pe-3 text-start">{t("workHoursLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pe-3">{r.date}</td>
                  <td className="py-2 pe-3 text-muted-foreground">{t(`attendanceStatus${r.status.charAt(0).toUpperCase()}${r.status.slice(1)}`)}</td>
                  <td className="py-2 pe-3 text-muted-foreground">{r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</td>
                  <td className="py-2 pe-3 text-muted-foreground">{r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : "—"}</td>
                  <td className="py-2 pe-3 text-muted-foreground">{r.work_hours ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}