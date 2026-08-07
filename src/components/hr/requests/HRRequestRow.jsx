import React from "react";
import { Link } from "react-router-dom";
import { Check, X, Paperclip } from "lucide-react";

const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-100 text-rose-700 border-rose-200",
};

// صف طلب واحد مرفوع من موظف إلى الموارد البشرية.
export default function HRRequestRow({ request, employee, canApprove, onDecide, ar, t }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
        {employee.name?.charAt(0)}
      </span>
      <div className="min-w-0 flex-1">
        <Link to={`/app/employees/${employee.id}`} className="block truncate text-sm font-semibold hover:text-accent">
          {employee.name} — {t(request.type)}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {request.startDate} → {request.endDate} · {request.days || "—"} {ar ? "يوم" : "days"}
          {request.reason ? ` · ${request.reason}` : ""}
          {request.files?.length ? " · 📎" : ""}
        </p>
      </div>
      <span className={`rounded-full border px-2.5 py-1 text-[11px] ${STATUS_STYLES[request.status] || STATUS_STYLES.pending}`}>
        {t(request.status)}
      </span>
      {canApprove && request.status === "pending" && (
        <span className="flex gap-2">
          <button onClick={() => onDecide(employee, request, "approved")} className="flex items-center gap-1 rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">
            <Check className="h-3.5 w-3.5" /> {ar ? "اعتماد" : "Approve"}
          </button>
          <button onClick={() => onDecide(employee, request, "rejected")} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-xs">
            <X className="h-3.5 w-3.5" /> {ar ? "رفض" : "Reject"}
          </button>
        </span>
      )}
      {request.files?.length > 0 && <Paperclip className="h-4 w-4 text-muted-foreground" />}
    </div>
  );
}