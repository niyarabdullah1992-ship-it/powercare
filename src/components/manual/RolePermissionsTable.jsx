import React from "react";

const ROLES = [["employee", "موظف"], ["stationManager", "مدير محطة"], ["operationsManager", "مدير عمليات"], ["director", "مدير"], ["owner", "مالك"]];
const tone = (value) => value === "✓" ? "bg-emerald-500/10 text-emerald-700" : value === "جزئي" ? "bg-amber-500/10 text-amber-700" : "bg-muted/60 text-muted-foreground";

export default function RolePermissionsTable({ rows = [], title = "مقارنة الأدوار والصلاحيات", dark = false }) {
  return <div className={dark ? "rounded-2xl bg-foreground p-5 text-background md:p-7" : "mt-6"}>
    <h3 className={`mb-3 text-sm font-bold ${dark ? "text-background" : "text-foreground"}`}>{title}</h3>
    <div className="overflow-x-auto rounded-xl border border-border/70"><table className="w-full min-w-[720px] border-collapse text-xs">
      <thead className={dark ? "bg-background/10" : "bg-muted/50"}><tr><th className="p-3 text-right">الإجراء</th>{ROLES.map(([key, label]) => <th key={key} className="p-3 text-center">{label}</th>)}</tr></thead>
      <tbody>{rows.map((row) => <tr key={row.action} className="border-t border-border/60"><td className="p-3 font-medium">{row.action}</td>{ROLES.map(([key]) => <td key={key} className="p-2 text-center"><span className={`inline-flex min-w-12 justify-center rounded-full px-2 py-1 font-bold ${tone(row[key])}`}>{row[key]}</span></td>)}</tr>)}</tbody>
    </table></div>
  </div>;
}