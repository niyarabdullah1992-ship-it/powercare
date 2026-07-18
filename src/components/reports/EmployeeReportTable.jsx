import React, { useState, useEffect, useMemo } from "react";
import { Search, FileSpreadsheet, Users, List, GitCompare } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/dateFormat";
import { exportCSV } from "@/lib/exportReport";
import ReportCard from "@/components/reports/ReportCard";
import ReportTableHead from "@/components/reports/ReportTableHead";
import GroupVsGroupComparison from "@/components/reports/GroupVsGroupComparison";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

// Free-form employee comparison table for the company owner — pick any employees
// (regardless of station) and see every aspect side by side, with a full Excel export.
export default function EmployeeReportTable({ data, company, targets, t, lang }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // null = not initialized yet
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState("list"); // "list" | "groups"

  useEffect(() => {
    if (selected === null) setSelected(data.employees.map((e) => e.id));
  }, [data.employees]);

  const stationName = (id) => data.stations.find((s) => s.id === id)?.name || t("hq");
  const empStation = (id) => data.employees.find((e) => e.id === id)?.stationId || null;

  const targetStationKey = (tg) => {
    if (tg.assignment_type === "station_team") return tg.assignment_id || tg.station_id || null;
    if (tg.assignment_type === "member") return tg.station_id || empStation(tg.employee_id) || null;
    if (tg.assignment_type === "hq_team") return "hq";
    return tg.station_id || null;
  };

  const rows = useMemo(() => {
    return data.employees.map((e) => {
      const memberTargets = targets.filter((tg) => tg.assignment_type === "member" && tg.employee_id === e.id);
      const completed = memberTargets.filter((tg) => tg.status === "completed").length;
      const overdue = memberTargets.filter((tg) => tg.status === "overdue").length;
      const leaves = e.leaveRequests || [];
      const approvedDays = leaves.filter((r) => r.status === "approved").reduce((sum, r) => sum + (r.days || 0), 0);
      return {
        id: e.id,
        name: e.name,
        station: e.stationId ? stationName(e.stationId) : t("hq"),
        role: getRoleLabel(company, e.role, t),
        position: e.profile?.position || "—",
        email: e.email || "—",
        phone: e.phone || "—",
        points: e.points || 0,
        certificates: (e.certificates || []).length,
        completed,
        overdue,
        leaveRequests: leaves.length,
        approvedDays,
        hireDate: e.profile?.hireDate ? formatDate(e.profile.hireDate, lang) : "—",
      };
    });
  }, [data.employees, targets, company, lang]);

  const filteredList = useMemo(() => {
    return data.employees
      .filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
      .slice()
      .sort((a, b) => {
        const stA = a.stationId ? stationName(a.stationId) : t("hq");
        const stB = b.stationId ? stationName(b.stationId) : t("hq");
        return stA === stB ? a.name.localeCompare(b.name) : stA.localeCompare(stB);
      });
  }, [data.employees, data.stations, search, lang]);

  const compared = useMemo(() => {
    if (selected === null) return [];
    return rows
      .filter((r) => selected.includes(r.id))
      .slice()
      .sort((a, b) => (a.station === b.station ? a.name.localeCompare(b.name) : a.station.localeCompare(b.station)));
  }, [rows, selected]);

  const toggle = (id) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const exportAll = () => {
    const headers = [
      t("employeeName"), t("station"), t("role"), t("position"), t("email"), t("contact"),
      t("points"), t("certificates"), t("completed"), t("overdue"), t("leaveRequests"), t("days"), t("hireDate"),
    ];
    const exportRows = compared.map((r) => [
      r.name, r.station, r.role, r.position, r.email, r.phone,
      r.points, r.certificates, r.completed, r.overdue, r.leaveRequests, r.approvedDays, r.hireDate,
    ]);
    exportCSV("employee-report.csv", headers, exportRows);
  };

  if (selected === null) return null;

  return (
    <div className="space-y-4">
      {/* Mode toggle: free list comparison vs. group-vs-group aggregate comparison */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => setMode("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "list" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
        >
          <List className="w-3.5 h-3.5" /> {t("listView")}
        </button>
        <button
          onClick={() => setMode("groups")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "groups" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
        >
          <GitCompare className="w-3.5 h-3.5" /> {t("groupVsGroup")}
        </button>
      </div>

      {mode === "groups" ? (
        <GroupVsGroupComparison rows={rows} employees={filteredList} t={t} />
      ) : (
      <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full ps-9 pe-3 py-2 rounded-md border border-input text-sm font-body"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPicker((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted">
            <Users className="w-3.5 h-3.5" /> {t("select")}
          </button>
          <button
            onClick={exportAll}
            disabled={compared.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-xs font-body hover:bg-muted disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Excel
          </button>
        </div>
      </div>

      {/* Employee picker */}
      {showPicker && (
      <ReportCard className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <button onClick={() => setSelected(data.employees.map((e) => e.id))} className="text-xs text-accent hover:underline font-body">{t("all")}</button>
          <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:underline font-body">{t("cancel")}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 max-h-48 overflow-y-auto">
          {filteredList.map((e) => {
            const checked = selected.includes(e.id);
            return (
              <button
                key={e.id}
                onClick={() => toggle(e.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-body text-start transition ${checked ? "bg-foreground text-background" : "hover:bg-muted"}`}
              >
                <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 flex items-center justify-center ${checked ? "bg-background border-background" : "border-current"}`}>
                  {checked && <span className="w-2 h-2 rounded-[1px] bg-foreground" />}
                </span>
                <span className="truncate">{e.name}</span>
              </button>
            );
          })}
          {filteredList.length === 0 && <p className="text-xs text-muted-foreground font-body p-2">{t("noResults")}</p>}
        </div>
      </ReportCard>
      )}

      {/* Comparison table */}
      <ReportCard className="overflow-x-auto">
        {compared.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-6">{t("noResults")}</p>
        ) : (
          <table className="w-full text-sm font-body mobile-cards">
            <ReportTableHead columns={[t("employeeName"), t("station"), t("role"), t("position"), t("email"), t("contact"), t("points"), t("certificates"), t("completed"), t("overdue"), t("leaveRequests"), t("days"), t("hireDate")]} />
            <tbody>
              {compared.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td data-label={t("employeeName")} className="py-2.5 px-2 font-medium whitespace-nowrap"><EmployeeNameLink employeeId={r.id} employeeName={r.name} /></td>
                  <td data-label={t("station")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.station}</td>
                  <td data-label={t("role")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.role}</td>
                  <td data-label={t("position")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.position}</td>
                  <td data-label={t("email")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.email}</td>
                  <td data-label={t("contact")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.phone}</td>
                  <td data-label={t("points")} className="py-2.5 px-2 text-muted-foreground">{r.points}</td>
                  <td data-label={t("certificates")} className="py-2.5 px-2 text-muted-foreground">{r.certificates}</td>
                  <td data-label={t("completed")} className="py-2.5 px-2 text-emerald-700">{r.completed}</td>
                  <td data-label={t("overdue")} className="py-2.5 px-2 text-red-700">{r.overdue}</td>
                  <td data-label={t("leaveRequests")} className="py-2.5 px-2 text-muted-foreground">{r.leaveRequests}</td>
                  <td data-label={t("days")} className="py-2.5 px-2 text-muted-foreground">{r.approvedDays}</td>
                  <td data-label={t("hireDate")} className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.hireDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReportCard>
      </>
      )}
    </div>
  );
}