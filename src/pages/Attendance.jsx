import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { canCreateTasks, canManageStations, isCompanyOwner, visibleEmployees } from "@/lib/permissions";
import CheckInOutCard from "@/components/attendance/CheckInOutCard";
import AttendanceDailyDashboard from "@/components/attendance/AttendanceDailyDashboard";
import AttendanceMonthlyReport from "@/components/attendance/AttendanceMonthlyReport";
import AttendanceSettingsPanel from "@/components/attendance/AttendanceSettingsPanel";

export default function Attendance() {
  const { t } = useI18n();
  const { data, currentUser, company } = useAuth();
  const [tab, setTab] = useState("team");

  const isManager = data && currentUser && canCreateTasks(currentUser);
  const canEditSettings = data && currentUser && (canManageStations(currentUser) || isCompanyOwner(currentUser, data));
  const employees = data && currentUser ? visibleEmployees(currentUser, data) : [];

  useEffect(() => {
    if (!isManager || !company || employees.length === 0) return;
    base44.functions.invoke("supabaseAttendance", {
      action: "syncRoster",
      companyId: company.id,
      employees: employees.map((e) => ({ id: e.id, name: e.name, stationId: e.stationId })),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, company?.id, employees.length]);

  if (!data || !currentUser) return null;

  const tabs = [
    { key: "team", label: t("teamTab") },
    { key: "report", label: t("reportTab") },
    ...(canEditSettings ? [{ key: "settings", label: t("settingsTab") }] : []),
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-semibold">{t("attendance")}</h1>

      <CheckInOutCard currentUser={currentUser} company={company} t={t} />

      {isManager && (
        <div className="space-y-4">
          <div className="flex gap-2 border-b border-border">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`px-3 py-2 text-sm font-body border-b-2 -mb-px transition ${tab === tb.key ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {tab === "team" && <AttendanceDailyDashboard employees={employees} t={t} />}
          {tab === "report" && <AttendanceMonthlyReport employees={employees} defaultEmployeeId={currentUser.id} t={t} />}
          {tab === "settings" && canEditSettings && <AttendanceSettingsPanel company={company} currentUser={currentUser} t={t} />}
        </div>
      )}
    </div>
  );
}