import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import { PRESENCE_OPTIONS } from "@/components/employees/PresenceStatusPicker";
import { Users } from "lucide-react";

// Manager-facing snapshot of every visible employee's current status: on leave,
// checked out, live presence (online/away/busy/in a call), or not checked in yet.
export default function TeamStatusPanel({ employees, t }) {
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

  const statusFor = (emp, att) => {
    if (isOnLeaveToday(emp)) return { labelKey: "onLeaveStatus", dot: "bg-sky-500" };
    if (!att?.check_in_at) return { labelKey: "attendanceStatusNotYet", dot: "bg-muted-foreground" };
    if (att.check_out_at) return { labelKey: "checkedOutStatus", dot: "bg-slate-400" };
    const presence = PRESENCE_OPTIONS.find((o) => o.key === emp.presenceStatus) || PRESENCE_OPTIONS[0];
    return { labelKey: presence.labelKey, dot: presence.dot };
  };

  return (
    <div className="p-6 border border-border bg-card">
      <h3 className="hero-title text-2xl mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" strokeWidth={1.5} /> {t("teamStatus")}
      </h3>
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="divide-y divide-border">
          {employees.map((e) => {
            const att = byEmployee[e.id];
            const status = statusFor(e, att);
            return (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0">
                  {e.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-body truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground font-body">
                    {att?.check_in_at ? `${t("checkedInAt")} ${new Date(att.check_in_at).toLocaleTimeString()}` : "—"}
                    {att?.check_out_at ? ` · ${t("checkedOutAt")} ${new Date(att.check_out_at).toLocaleTimeString()}` : ""}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-xs font-body shrink-0">
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  {t(status.labelKey)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}