import React from "react";
import { formatDate } from "@/lib/dateFormat";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

const statusStyle = {
  approved: "bg-emerald-100 text-emerald-700 border-emerald-300",
  rejected: "bg-red-100 text-red-700 border-red-300",
  pending: "bg-amber-100 text-amber-700 border-amber-300",
};

export default function AttendanceLeaveRequests({ employees, stations, t, lang }) {
  const stationName = (id) => stations.find((station) => station.id === id)?.name || t("hq");
  const requests = employees.flatMap((employee) =>
    (employee.leaveRequests || []).map((request) => ({ ...request, employee }))
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5">
      <h3 className="mb-4 font-heading text-lg font-semibold">{t("leaveRequests")}</h3>
      {requests.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{t("noLeaveRequests")}</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body mobile-cards">
            <thead><tr className="border-b border-border text-muted-foreground">
              {[t("employeeName"), t("station"), t("leaveType"), t("startDate"), t("endDate"), t("days"), t("status")].map((label) => <th key={label} className="px-2 py-2 text-start text-xs">{label}</th>)}
            </tr></thead>
            <tbody>{requests.map((request) => <tr key={`${request.employee.id}-${request.id}`} className="border-b border-border/60 last:border-0">
              <td data-label={t("employeeName")} className="px-2 py-2.5 font-medium"><EmployeeNameLink employeeId={request.employee.id} employeeName={request.employee.name} /></td>
              <td data-label={t("station")} className="px-2 py-2.5 text-muted-foreground">{stationName(request.employee.stationId)}</td>
              <td data-label={t("leaveType")} className="px-2 py-2.5 text-muted-foreground">{t(request.type)}</td>
              <td data-label={t("startDate")} className="px-2 py-2.5 text-muted-foreground">{formatDate(request.startDate, lang)}</td>
              <td data-label={t("endDate")} className="px-2 py-2.5 text-muted-foreground">{formatDate(request.endDate, lang)}</td>
              <td data-label={t("days")} className="px-2 py-2.5 text-muted-foreground">{request.days}</td>
              <td data-label={t("status")} className="px-2 py-2.5"><span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${statusStyle[request.status] || statusStyle.pending}`}>{t(request.status)}</span></td>
            </tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}