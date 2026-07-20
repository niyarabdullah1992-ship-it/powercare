import React from "react";
import { Radio } from "lucide-react";

const LEVEL_BADGE = {
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
  none: "bg-muted text-muted-foreground",
};

// Per-station health table: staffing, tasks, completion and safety at a glance.
export default function ExecStationTable({ rows, lang }) {
  const ar = lang === "ar";
  const levelLabel = { red: ar ? "حرجة" : "Critical", amber: ar ? "متابعة" : "Watch", green: ar ? "آمنة" : "Safe", none: ar ? "غير مقيّمة" : "N/A" };
  return (
    <div className="overflow-hidden rounded-2xl border border-ops-border bg-ops-surface shadow-sm">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
        <Radio className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <h3 className="font-heading text-base font-semibold">{ar ? "حالة المحطات" : "Station Status"}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm font-body text-muted-foreground">{ar ? "لا توجد محطات بعد" : "No stations yet"}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body mobile-cards">
            <thead>
              <tr className="border-b border-border text-start text-xs text-muted-foreground">
                <th className="px-5 py-3 text-start">{ar ? "المحطة" : "Station"}</th>
                <th className="px-5 py-3 text-start">{ar ? "المدير" : "Manager"}</th>
                <th className="px-5 py-3 text-start">{ar ? "الموظفون" : "Staff"}</th>
                <th className="px-5 py-3 text-start">{ar ? "مهام جارية" : "Active Tasks"}</th>
                <th className="px-5 py-3 text-start">{ar ? "الإنجاز" : "Completion"}</th>
                <th className="px-5 py-3 text-start">{ar ? "بلاغات" : "Reports"}</th>
                <th className="px-5 py-3 text-start">{ar ? "السلامة" : "Safety"}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3 font-medium" data-label={ar ? "المحطة" : "Station"}>
                    {r.name}
                    <span className="block text-[11px] font-normal text-muted-foreground">{r.location}</span>
                  </td>
                  <td className="px-5 py-3" data-label={ar ? "المدير" : "Manager"}>{r.manager || "—"}</td>
                  <td className="px-5 py-3" data-label={ar ? "الموظفون" : "Staff"}>{r.staff}</td>
                  <td className="px-5 py-3" data-label={ar ? "مهام جارية" : "Active Tasks"}>{r.activeTasks}</td>
                  <td className="px-5 py-3" data-label={ar ? "الإنجاز" : "Completion"}>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${r.completion}%` }} />
                      </div>
                      <span className="text-xs">{r.completion}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3" data-label={ar ? "بلاغات" : "Reports"}>
                    {r.openComplaints > 0 ? <span className="text-destructive font-medium">{r.openComplaints}</span> : "0"}
                  </td>
                  <td className="px-5 py-3" data-label={ar ? "السلامة" : "Safety"}>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${LEVEL_BADGE[r.safety]}`}>{levelLabel[r.safety]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}