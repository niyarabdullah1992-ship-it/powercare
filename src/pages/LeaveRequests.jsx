import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { visibleStations } from "@/lib/permissions";
import MobileSelect from "@/components/mobile/MobileSelect";
import HRRequestsPanel from "@/components/hr/HRRequestsPanel";
import LeaveBalancesTable from "@/components/hr/LeaveBalancesTable";

// Central approvals inbox + company-wide leave balances, in one two-tab screen.
export default function LeaveRequests() {
  const { lang } = useI18n();
  const { data, company, currentUser } = useAuth();
  const [station, setStation] = useState("all");
  const [tab, setTab] = useState("requests");
  const ar = lang === "ar";

  if (!data || !currentUser || !company) return null;

  const canEditBalances =
    currentUser.id === data.ownerId ||
    !!currentUser.hrLevelId ||
    ["station_manager", "pgm", "ops_manager", "director"].includes(currentUser.role);

  const stations = visibleStations(currentUser, data);
  const firstStationId = data.stations?.[0]?.id || null;
  const stationOf = (emp) => emp.stationId || firstStationId;
  const scopedEmployees = (data.employees || []).filter((emp) => stations.some((s) => s.id === stationOf(emp)));
  const employees = station === "all" ? scopedEmployees : scopedEmployees.filter((emp) => stationOf(emp) === station);

  const pendingOf = (list) => list.reduce((sum, emp) => sum + (emp.leaveRequests || []).filter((r) => r.status === "pending").length, 0);
  const pendingAll = pendingOf(scopedEmployees);

  const stationOptions = [
    { value: "all", label: `${ar ? "كل الفروع" : "All stations"} (${scopedEmployees.length})` },
    ...stations
      .map((s) => ({ station: s, count: scopedEmployees.filter((emp) => stationOf(emp) === s.id).length }))
      .filter(({ count }) => count > 0)
      .map(({ station: s, count }) => ({ value: s.id, label: `${s.name} (${count})` })),
  ];

  const tabs = [
    { key: "requests", label: ar ? "الطلبات" : "Requests", badge: pendingAll },
    { key: "balances", label: ar ? "الأرصدة" : "Balances" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-heading text-lg font-semibold">{ar ? "الإجازات والطلبات" : "Leaves & Requests"}</h1>
        <MobileSelect value={station} onChange={setStation} options={stationOptions} className="w-56" />
      </div>

      <div className="flex gap-1.5">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-md border px-3 py-1.5 text-sm font-body ${tab === item.key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted"}`}
          >
            {item.label}
            {item.badge ? <span className="ms-1.5 text-xs opacity-80">{item.badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === "requests" ? (
        <HRRequestsPanel data={{ ...data, employees }} companyId={company.id} currentUser={currentUser} ar={ar} />
      ) : (
        <LeaveBalancesTable employees={employees} companyId={company.id} canEdit={canEditBalances} ar={ar} />
      )}
    </div>
  );
}