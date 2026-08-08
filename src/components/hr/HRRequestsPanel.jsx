import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Award, Check, X, Inbox } from "lucide-react";
import { setLeaveRequestStatus, setCertificateStatus } from "@/lib/store";
import LeaveRequestItem from "@/components/employees/LeaveRequestItem";

// Unified HR inbox: every pending leave request and certificate across the company.
export default function HRRequestsPanel({ data, companyId, currentUser, ar }) {
  const [showAll, setShowAll] = useState(false);

  const leaves = data.employees.flatMap((emp) =>
    (emp.leaveRequests || []).filter((r) => showAll || r.status === "pending").map((r) => ({ emp, request: r }))
  );
  const certs = data.employees.flatMap((emp) =>
    (emp.certificates || []).filter((c) => showAll || (c.status || "pending") === "pending").map((c) => ({ emp, cert: c }))
  );

  const EmpLink = ({ emp }) => (
    <Link to={`/app/employees/${emp.id}`} className="text-xs font-body text-accent hover:underline">{emp.name}</Link>
  );

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Inbox className="h-4 w-4 text-accent" />{ar ? "الإجازات والطلبات" : "Leaves & Requests"}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{leaves.length + certs.length}</span>
        </h2>
        <button onClick={() => setShowAll((v) => !v)} className="rounded-md border border-border px-3 py-1.5 text-xs font-body hover:bg-muted">
          {showAll ? (ar ? "المعلّقة فقط" : "Pending only") : (ar ? "عرض الكل" : "Show all")}
        </button>
      </div>

      {leaves.length === 0 && certs.length === 0 && (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد طلبات." : "No requests."}</p>
      )}

      <div className="space-y-3">
        {leaves.map(({ emp, request }) => (
          <div key={`${emp.id}-${request.id}`} className="space-y-1">
            <EmpLink emp={emp} />
            <LeaveRequestItem
              request={request}
              canApprove={request.status === "pending"}
              onDecide={(id, status) => setLeaveRequestStatus(companyId, emp.id, id, status, currentUser.name)}
            />
          </div>
        ))}

        {certs.map(({ emp, cert }) => (
          <div key={`${emp.id}-${cert.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
            <div className="min-w-0">
              <EmpLink emp={emp} />
              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 truncate text-sm font-body hover:underline">
                <Award className="h-4 w-4 shrink-0 text-accent" />{cert.name}
              </a>
            </div>
            {(cert.status || "pending") === "pending" && (
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setCertificateStatus(companyId, emp.id, cert.id, "approved", currentUser.name)} className="rounded p-1.5 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                <button onClick={() => setCertificateStatus(companyId, emp.id, cert.id, "rejected", currentUser.name)} className="rounded p-1.5 text-destructive hover:bg-red-50"><X className="h-4 w-4" /></button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}