import React from "react";
import { useI18n } from "@/lib/i18n";
import { Clock, CheckCircle2, XCircle, Check, X, CalendarClock } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";
import { formatDate } from "@/lib/dateFormat";

const STATUS_STYLE = {
  pending: { tone: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { tone: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  rejected: { tone: "bg-destructive/15 text-destructive", icon: XCircle },
};

export default function LeaveRequestItem({ request, canApprove, onDecide }) {
  const { t, lang } = useI18n();
  const { tone, icon: StatusIcon } = STATUS_STYLE[request.status];

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-body font-medium">{t(request.type)} · {request.startDate} → {request.endDate} ({request.days || 1} {t("days")})</p>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body ${tone}`}>
          <StatusIcon className="w-3 h-3" /> {t(request.status)}
        </span>
      </div>
      {request.type === "annual" && request.status === "approved" && request.activeStartDate && (
        <p className="flex items-center gap-1.5 text-xs text-accent font-body">
          <CalendarClock className="w-3.5 h-3.5" /> {t("activeVacationPeriod")}: {formatDate(request.activeStartDate, lang)} → {formatDate(request.activeEndDate, lang)}
        </p>
      )}
      {request.reason && <p className="text-sm font-body text-muted-foreground">{request.reason}</p>}
      <CommentAttachments files={request.files} />
      {canApprove && request.status === "pending" && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onDecide(request.id, "approved")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
            <Check className="w-3.5 h-3.5" /> {t("approve")}
          </button>
          <button onClick={() => onDecide(request.id, "rejected")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive text-destructive text-xs font-body">
            <X className="w-3.5 h-3.5" /> {t("reject")}
          </button>
        </div>
      )}
    </div>
  );
}