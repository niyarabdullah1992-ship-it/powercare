import React, { useMemo } from "react";
import { formatDate } from "@/lib/dateFormat";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { checkApproveLeaveGate, deriveLeaveStats, LEAVE_TYPES } from "@/lib/leaveDerivations";

const statusStyle = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
};

export default function AttendanceLeaveRequests({ employees, stations, t, lang }) {
  const ar = lang === "ar";
  const stationName = (id) => stations.find((station) => station.id === id)?.name || t("hq");
  const requests = employees.flatMap((employee) =>
    (employee.leaveRequests || []).map((request) => ({ ...request, employee }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const stats = useMemo(() => deriveLeaveStats(requests), [requests]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { value: stats.pending, label: ar ? "بانتظار القرار" : "Pending" },
          { value: stats.needsDoc, label: ar ? "تحتاج مستندًا" : "Need document" },
          { value: stats.approved, label: ar ? "معتمدة" : "Approved" },
          { value: stats.rejected, label: ar ? "مرفوضة" : "Rejected" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4">
            <p className="font-heading text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground font-body">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 md:p-5">
        <h3 className="mb-1 font-heading text-lg font-semibold">{t("leaveRequests")}</h3>
        <p className="mb-4 text-xs text-muted-foreground font-body">
          {ar
            ? "الطلب الذي يتجاوز 5 أيام يحتاج مبررًا ومستندًا مرفقًا قبل الاعتماد."
            : "Any request longer than 5 days needs a justification and an attachment before approval."}
        </p>
        {requests.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("noLeaveRequests")}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body mobile-cards">
              <thead><tr className="border-b border-border text-muted-foreground">
                {[t("employeeName"), t("station"), t("leaveType"), t("startDate"), t("endDate"), t("days"), t("status")].map((label) => <th key={label} className="px-2 py-2 text-start text-xs">{label}</th>)}
              </tr></thead>
              <tbody>{requests.map((request) => {
                const typeMeta = (LEAVE_TYPES || []).find((x) => x.key === request.type);
                const gate = request.status === "pending" ? checkApproveLeaveGate(request) : { ok: true };
                return (
                  <tr key={`${request.employee.id}-${request.id}`} className="border-b border-border/60 last:border-0">
                    <td data-label={t("employeeName")} className="px-2 py-2.5 font-medium"><EmployeeNameLink employeeId={request.employee.id} employeeName={request.employee.name} /></td>
                    <td data-label={t("station")} className="px-2 py-2.5 text-muted-foreground">{stationName(request.employee.stationId)}</td>
                    <td data-label={t("leaveType")} className="px-2 py-2.5 text-muted-foreground">
                      {ar ? (typeMeta?.ar || t(request.type)) : (typeMeta?.en || t(request.type))}
                      {typeMeta?.article ? (
                        <span className="ms-1 text-[10px] text-[#5A6B85]">· {ar ? "م" : "Art."} {typeMeta.article}</span>
                      ) : null}
                    </td>
                    <td data-label={t("startDate")} className="px-2 py-2.5 text-muted-foreground">{formatDate(request.startDate, lang)}</td>
                    <td data-label={t("endDate")} className="px-2 py-2.5 text-muted-foreground">{formatDate(request.endDate, lang)}</td>
                    <td data-label={t("days")} className="px-2 py-2.5 text-muted-foreground">{request.days}</td>
                    <td data-label={t("status")} className="px-2 py-2.5">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${statusStyle[request.status] || statusStyle.pending}`}>{t(request.status)}</span>
                      {!gate.ok && (
                        <span className="ms-2 text-[10px] text-destructive">
                          {ar ? (gate.reason || gate.error) : (gate.reasonEn || gate.reason || gate.error)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
