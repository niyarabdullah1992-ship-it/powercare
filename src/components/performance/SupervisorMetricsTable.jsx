import React from "react";
import { ShieldAlert, UserCheck } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

// مؤشرات المشرف نفسه: الرفض مقابل الأقران، زمن الاعتماد، الاعتراضات المنقوضة، الاعتماد التلقائي.
export default function SupervisorMetricsTable({ model, lang }) {
  const ar = lang === "ar";
  const { supervisors, peerAvgRejection } = model;
  const pct = (v) => `${Math.round(v * 100)}%`;

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> {ar ? "مؤشرات المشرفين" : "Supervisor metrics"}
        </h2>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {ar
            ? `السلطة التقديرية خاضعة للتدقيق: نسبة الرفض تُقارن بمتوسط الأقران (${pct(peerAvgRejection)})، والاعتماد المتأخر ينقضي تلقائياً بعد المهلة.`
            : `Discretion is auditable: rejection rate vs peer average (${pct(peerAvgRejection)}); stalled reviews auto-approve after the deadline.`}
        </p>
      </div>
      {supervisors.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد بيانات مراجعة بعد — تُبنى المؤشرات مع أول اعتماد أو رفض." : "No review data yet — metrics build with the first approval or rejection."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-body mobile-cards">
            <thead>
              <tr className="text-start">
                <th className="p-2 text-start">{ar ? "المشرف" : "Supervisor"}</th>
                <th className="p-2 text-start">{ar ? "اعتمادات" : "Approvals"}</th>
                <th className="p-2 text-start">{ar ? "رفض" : "Rejections"}</th>
                <th className="p-2 text-start">{ar ? "نسبة الرفض" : "Rejection rate"}</th>
                <th className="p-2 text-start">{ar ? "متوسط زمن الاعتماد" : "Avg review time"}</th>
                <th className="p-2 text-start">{ar ? "اعتماد تلقائي" : "Auto-approved"}</th>
                <th className="p-2 text-start">{ar ? "اعتراضات نُقضت ضده" : "Overturned"}</th>
              </tr>
            </thead>
            <tbody>
              {supervisors.map((s) => {
                const flagged = s.rejections >= 3 && s.rejectionRate > Math.max(peerAvgRejection * 1.5, 0.25);
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-2" data-label={ar ? "المشرف" : "Supervisor"}>
                      <EmployeeNameLink employeeId={s.id} employeeName={s.name} />
                    </td>
                    <td className="p-2" data-label={ar ? "اعتمادات" : "Approvals"}>{s.approvals}</td>
                    <td className="p-2" data-label={ar ? "رفض" : "Rejections"}>{s.rejections}</td>
                    <td className="p-2" data-label={ar ? "نسبة الرفض" : "Rejection rate"}>
                      <span className={flagged ? "inline-flex items-center gap-1 text-red-600 font-medium" : ""}>
                        {flagged && <ShieldAlert className="w-3 h-3" />} {pct(s.rejectionRate)}
                      </span>
                    </td>
                    <td className="p-2" data-label={ar ? "متوسط زمن الاعتماد" : "Avg review time"}>
                      {s.avgReviewHours === null ? "—" : ar ? `${s.avgReviewHours.toFixed(1)} ساعة` : `${s.avgReviewHours.toFixed(1)}h`}
                    </td>
                    <td className="p-2" data-label={ar ? "اعتماد تلقائي" : "Auto-approved"}>{s.autoApprovals}</td>
                    <td className="p-2" data-label={ar ? "اعتراضات نُقضت ضده" : "Overturned"}>{s.overturned}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {supervisors.some((s) => s.rejections >= 3 && s.rejectionRate > Math.max(peerAvgRejection * 1.5, 0.25)) && (
        <p className="text-[11px] text-red-600 font-body flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          {ar ? "مشرف تجاوز عتبة الرفض مقارنة بأقرانه — يُنصح بتحويل اعتماداته لمراجع ثانٍ." : "A supervisor exceeded the peer rejection threshold — consider routing their reviews to a second reviewer."}
        </p>
      )}
    </section>
  );
}