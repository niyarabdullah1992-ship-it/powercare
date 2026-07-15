import React from "react";
import { Link } from "react-router-dom";
import { Lightbulb, CheckCircle2, ChevronRight } from "lucide-react";

// Rule-based smart suggestions — scans today's data and surfaces exactly what
// needs the manager's attention, each with a one-tap action link.
export default function SmartAlertsPanel({ teamEmployees, attendanceRows, pendingReports, stoppageCount, anonOpenCount, stations, t, dir }) {
  const notCheckedIn = teamEmployees.filter(
    (e) => !attendanceRows.some((r) => (r.employee_id === e.id || r.employeeId === e.id) && r.check_in_at)
  );
  const noLocation = stations.filter((s) => s.lat == null || s.lng == null);

  const alerts = [
    notCheckedIn.length > 0 && {
      key: "att",
      text: `${notCheckedIn.length} ${t("notCheckedInAlert")}`,
      hint: notCheckedIn.slice(0, 3).map((e) => e.name).join("، "),
      to: "/app/attendance",
    },
    pendingReports > 0 && { key: "rep", text: `${pendingReports} ${t("reportsAwaiting")}`, to: "/app/daily-report" },
    stoppageCount > 0 && { key: "stop", text: `${stoppageCount} ${t("openStoppages")}`, to: "/app/performance" },
    anonOpenCount > 0 && { key: "anon", text: `${anonOpenCount} ${t("openComplaintsAlert")}`, to: "/app/complaints" },
    noLocation.length > 0 && { key: "loc", text: `${noLocation.length} ${t("stationsNoLocation")}`, to: "/app/attendance" },
  ].filter(Boolean);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="font-heading text-lg font-semibold flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-accent" /> {t("smartAlerts")}
      </h3>
      {alerts.length === 0 ? (
        <p className="text-sm font-body text-muted-foreground flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t("allClearAlert")}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {alerts.map((a) => (
            <Link key={a.key} to={a.to} className="flex items-center gap-3 py-2.5 group">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body">{a.text}</p>
                {a.hint && <p className="text-xs text-muted-foreground font-body truncate" dir="auto">{a.hint}</p>}
              </div>
              <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0 ${dir === "rtl" ? "rotate-180" : ""}`} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}