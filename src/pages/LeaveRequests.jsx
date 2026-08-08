import React, { useState } from "react";
import { Inbox } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import PageHeader from "@/components/PageHeader";
import HRRequestsPanel from "@/components/hr/HRRequestsPanel";
import LeaveBalancesTable from "@/components/hr/LeaveBalancesTable";
import LeaveStationTabs from "@/components/hr/LeaveStationTabs";

// Central approvals inbox + company-wide leave balances, organized by station.
export default function LeaveRequests() {
  const { lang } = useI18n();
  const { data, company, currentUser } = useAuth();
  const [station, setStation] = useState("all");
  const ar = lang === "ar";

  if (!data || !currentUser || !company) return null;

  // Managers, executives, the owner and HR-position holders can adjust balances.
  const canEditBalances =
    currentUser.id === data.ownerId ||
    !!currentUser.hrLevelId ||
    ["station_manager", "pgm", "ops_manager", "director"].includes(currentUser.role);

  const stations = visibleStations(currentUser, data);
  const firstStationId = data.stations?.[0]?.id || null;
  const stationOf = (emp) => emp.stationId || firstStationId;
  const scopedEmployees = (data.employees || []).filter((emp) => stations.some((s) => s.id === stationOf(emp)));
  const employees = station === "all" ? scopedEmployees : scopedEmployees.filter((emp) => stationOf(emp) === station);

  const pendingOf = (list) => list.reduce((sum, emp) =>
    sum + (emp.leaveRequests || []).filter((r) => r.status === "pending").length, 0);
  const counts = { all: pendingOf(scopedEmployees) };
  for (const s of stations) counts[s.id] = pendingOf(scopedEmployees.filter((emp) => stationOf(emp) === s.id));

  return (
    <div className="space-y-6">
      <PageHeader title={ar ? "الإجازات والطلبات" : "Leaves & Requests"} icon={Inbox} />
      <LeaveStationTabs stations={stations} value={station} onChange={setStation} counts={counts} ar={ar} />
      <HRRequestsPanel data={{ ...data, employees }} companyId={company.id} currentUser={currentUser} ar={ar} />
      <LeaveBalancesTable
        employees={employees}
        companyId={company.id}
        canEdit={canEditBalances}
        ar={ar}
      />
    </div>
  );
}