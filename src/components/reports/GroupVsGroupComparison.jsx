import React, { useState, useMemo } from "react";
import GroupPicker from "@/components/reports/GroupPicker";
import ReportCard from "@/components/reports/ReportCard";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// Aggregate comparison between two freely-defined groups of employees — each
// group can hold a single employee (1-vs-1) or many (team-vs-team).
function aggregate(rows, ids) {
  const set = rows.filter((r) => ids.includes(r.id));
  const sum = (fn) => set.reduce((s, r) => s + fn(r), 0);
  const count = set.length || 1;
  return {
    count: set.length,
    totalPoints: sum((r) => r.points),
    avgPoints: Math.round(sum((r) => r.points) / count),
    completed: sum((r) => r.completed),
    overdue: sum((r) => r.overdue),
    certificates: sum((r) => r.certificates),
    leaveRequests: sum((r) => r.leaveRequests),
    approvedDays: sum((r) => r.approvedDays),
  };
}

export default function GroupVsGroupComparison({ rows, employees, t }) {
  const [groupA, setGroupA] = useState([]);
  const [groupB, setGroupB] = useState([]);

  const toggleA = (id) => setGroupA((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleB = (id) => setGroupB((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const a = useMemo(() => aggregate(rows, groupA), [rows, groupA]);
  const b = useMemo(() => aggregate(rows, groupB), [rows, groupB]);

  const metrics = [
    { key: "memberCount", label: t("members"), va: a.count, vb: b.count },
    { key: "totalPoints", label: t("totalPoints"), va: a.totalPoints, vb: b.totalPoints },
    { key: "avgPoints", label: t("avgPoints"), va: a.avgPoints, vb: b.avgPoints },
    { key: "completed", label: t("completed"), va: a.completed, vb: b.completed },
    { key: "overdue", label: t("overdue"), va: a.overdue, vb: b.overdue },
    { key: "certificates", label: t("certificates"), va: a.certificates, vb: b.certificates },
    { key: "leaveRequests", label: t("leaveRequests"), va: a.leaveRequests, vb: b.leaveRequests },
    { key: "days", label: t("days"), va: a.approvedDays, vb: b.approvedDays },
  ];

  const cellClass = (v, other, lowerIsBetter) => {
    if (v === other) return "text-muted-foreground";
    const better = lowerIsBetter ? v < other : v > other;
    return better ? "text-emerald-700 font-semibold" : "text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      <ReportCard className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <GroupPicker label={t("groupA")} employees={employees} selected={groupA} onToggle={toggleA} accent="bg-accent" disabledIds={groupB} />
        <GroupPicker label={t("groupB")} employees={employees} selected={groupB} onToggle={toggleB} accent="bg-foreground" disabledIds={groupA} />
      </ReportCard>

      <div className="flex justify-end">
        <ComparisonExportButtons
          title={t("groupVsGroup")}
          headers={[t("category"), t("groupA"), t("groupB")]}
          rows={groupA.length > 0 && groupB.length > 0 ? metrics.map((m) => [m.label, m.va, m.vb]) : []}
        />
      </div>

      <ReportCard>
        {groupA.length === 0 || groupB.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body text-center py-6">{t("selectAtLeastTwo")}</p>
        ) : (
          <>
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
                <th className="py-2 px-2 text-start">{t("category")}</th>
                <th className="py-2 px-2 text-start">{t("groupA")}</th>
                <th className="py-2 px-2 text-start">{t("groupB")}</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.key} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 px-2 font-medium">{m.label}</td>
                  <td className={`py-2.5 px-2 ${cellClass(m.va, m.vb, m.key === "overdue")}`}>{m.va}</td>
                  <td className={`py-2.5 px-2 ${cellClass(m.vb, m.va, m.key === "overdue")}`}>{m.vb}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </>
        )}
      </ReportCard>
    </div>
  );
}