import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PRESENCE_OPTIONS } from "@/components/employees/PresenceStatusPicker";
import { PenLine, Users } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { isActiveAttendance } from "@/lib/attendance";

// Manager-facing snapshot of every visible employee's current status: on leave,
// checked out, live presence (online/away/busy/in a call), or not checked in yet.
// Memoized — re-renders only when the employee list or translations change.
function TeamStatusPanel({ employees, t }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employees.length) { setRows([]); setLoading(false); return; }
    let active = true;
    const load = () => base44.functions.invoke("supabaseAttendance", { action: "listDaily", employeeIds: employees.map((e) => e.id) })
      .then((res) => { if (active) setRows(res?.data?.rows || []); })
      .catch(() => { if (active) setRows([]); })
      .finally(() => { if (active) setLoading(false); });
    setLoading(true);
    load();
    const timer = window.setInterval(load, 5000);
    const refresh = () => load();
    window.addEventListener("attendance-updated", refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("attendance-updated", refresh); };
  }, [employees.map((e) => e.id).join(",")]);

  const byEmployee = Object.fromEntries(rows.map((r) => [r.employee_id, r]));
  const activeEmployees = employees.filter((employee) => isActiveAttendance(byEmployee[employee.id]));

  const statusFor = (emp, attendance) => {
    const inZone = attendance?.in_zone === true || attendance?.inZone === true || attendance?.location_status === "inside";
    const manual = attendance?.manual_override === true || attendance?.manualOverride === true || attendance?.location_status === "manual";
    if (inZone) return { labelKey: "insideLocation", dot: "bg-emerald-500" };
    if (manual) return { labelKey: "manual", dot: "bg-violet-500" };
    const presence = PRESENCE_OPTIONS.find((o) => o.key === emp.presenceStatus) || PRESENCE_OPTIONS[0];
    return { labelKey: presence.labelKey, dot: presence.dot };
  };

  return (
    <div className="p-6 rounded-2xl border border-border bg-card">
      <h3 className="hero-title text-2xl mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" strokeWidth={1.5} /> {t("teamStatus")}
      </h3>
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-1/3 rounded bg-muted" />
                <div className="h-2.5 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : activeEmployees.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noAttendanceRecords")}</p>
      ) : (
        <div className="divide-y divide-border">
          {activeEmployees.map((e) => {
            const att = byEmployee[e.id];
            const status = statusFor(e, att);
            return (
              <div key={e.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-medium shrink-0">
                  {e.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <EmployeeNameLink employeeId={e.id} employeeName={e.name} className="block text-sm font-medium font-body truncate" />
                  <p className="text-xs text-muted-foreground font-body">
                    {att?.check_in_at ? `${t("checkedInAt")} ${new Date(att.check_in_at).toLocaleTimeString()}` : "—"}
                    {att?.check_out_at ? ` · ${t("checkedOutAt")} ${new Date(att.check_out_at).toLocaleTimeString()}` : ""}
                  </p>
                  {(att?.manual_override || att?.location_status === "manual") && <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] text-violet-700"><PenLine className="h-3 w-3" />{t("manual") || "Manual"} · {att.override_by || att.excused_by_name || "—"}</span>}
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

export default React.memo(TeamStatusPanel);