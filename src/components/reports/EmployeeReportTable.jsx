import React, { useState, useEffect, useMemo } from "react";
import { Search, FileSpreadsheet, Users } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";
import { formatDate } from "@/lib/dateFormat";
import { exportCSV } from "@/lib/exportReport";

// Free-form employee comparison table for the company owner — pick any employees
// (regardless of station) and see every aspect side by side, with a full Excel export.
export default function EmployeeReportTable({ data, company, targets, t, lang }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // null = not initialized yet

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

  const filteredList = data.employees.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()));
  const compared = selected === null ? [] : rows.filter((r) => selected.includes(r.id));

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
          <button onClick={() => setSelected(data.employees.map((e) => e.id))} className="text-xs text-accent hover:underline font-body">{t("all")}</button>
          <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:underline font-body">{t("cancel")}</button>
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
      <div className="p-3 rounded-xl border border-border bg-card max-h-48 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {filteredList.map((e) => (
            <button
              key={e.id}
              onClick={() => toggle(e.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-body border transition ${selected.includes(e.id) ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
            >
              <Users className="w-3 h-3" /> {e.name}
            </button>
          ))}
          {filteredList.length === 0 && <p className="text-xs text-muted-foreground font-body">{t("noResults")}</p>}
        </div>
      </div>

      {/* Comparison table */}
      <div className="p-4 rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
        {compared.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-6">{t("noResults")}</p>
        ) : (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-2 px-2 text-start">{t("employeeName")}</th>
                <th className="py-2 px-2 text-start">{t("station")}</th>
                <th className="py-2 px-2 text-start">{t("role")}</th>
                <th className="py-2 px-2 text-start">{t("position")}</th>
                <th className="py-2 px-2 text-start">{t("email")}</th>
                <th className="py-2 px-2 text-start">{t("contact")}</th>
                <th className="py-2 px-2 text-start">{t("points")}</th>
                <th className="py-2 px-2 text-start">{t("certificates")}</th>
                <th className="py-2 px-2 text-start">{t("completed")}</th>
                <th className="py-2 px-2 text-start">{t("overdue")}</th>
                <th className="py-2 px-2 text-start">{t("leaveRequests")}</th>
                <th className="py-2 px-2 text-start">{t("days")}</th>
                <th className="py-2 px-2 text-start">{t("hireDate")}</th>
              </tr>
            </thead>
            <tbody>
              {compared.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 px-2 font-medium whitespace-nowrap">{r.name}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.station}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.role}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.position}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.email}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.phone}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{r.points}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{r.certificates}</td>
                  <td className="py-2.5 px-2 text-emerald-700">{r.completed}</td>
                  <td className="py-2.5 px-2 text-red-700">{r.overdue}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{r.leaveRequests}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{r.approvedDays}</td>
                  <td className="py-2.5 px-2 text-muted-foreground whitespace-nowrap">{r.hireDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}