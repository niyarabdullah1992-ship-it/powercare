import React from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/dateFormat";

const BADGE = {
  manager: "bg-amber-50 text-amber-700 border-amber-200",
  finance: "bg-orange-50 text-orange-700 border-orange-200",
  hr: "bg-yellow-50 text-yellow-700 border-yellow-200",
};

// جدول «طلبات بانتظار الاعتماد» — بيانات حية من طلبات الإجازة والتقارير المعلّقة.
export default function PendingApprovalsTable({ rows, lang }) {
  const ar = lang === "ar";
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-heading text-base font-semibold">{ar ? "طلبات بانتظار الاعتماد" : "Pending approvals"}</h3>
        <Link to="/app/hr/requests" className="text-xs font-medium text-accent-text hover:underline">
          {ar ? "عرض الكل" : "View all"}
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground font-body">
          {ar ? "لا توجد طلبات بانتظار الاعتماد" : "No pending approvals"}
        </p>
      ) : (
        <table className="w-full text-sm mobile-cards">
          <thead>
            <tr className="text-start">
              <th className="px-4 py-2.5 text-start font-medium">{ar ? "الموظف" : "Employee"}</th>
              <th className="px-4 py-2.5 text-start font-medium">{ar ? "نوع الطلب" : "Request type"}</th>
              <th className="px-4 py-2.5 text-start font-medium">{ar ? "التاريخ" : "Date"}</th>
              <th className="px-4 py-2.5 text-start font-medium">{ar ? "الحالة" : "Status"}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-border/60">
                <td data-label={ar ? "الموظف" : "Employee"} className="px-4 py-3">
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {row.name?.charAt(0)}
                    </span>
                    <span className="font-medium truncate">{row.name}</span>
                  </span>
                </td>
                <td data-label={ar ? "نوع الطلب" : "Type"} className="px-4 py-3 text-muted-foreground">{row.type}</td>
                <td data-label={ar ? "التاريخ" : "Date"} className="px-4 py-3 text-muted-foreground">{row.date ? formatDate(row.date, lang, { day: "numeric", month: "long" }) : "—"}</td>
                <td data-label={ar ? "الحالة" : "Status"} className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-medium ${BADGE[row.badge] || BADGE.manager}`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}