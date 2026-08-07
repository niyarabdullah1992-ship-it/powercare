import React from "react";
import { CalendarDays } from "lucide-react";
import OverviewCard from "./OverviewCard";

const TONE = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-destructive/15 text-destructive",
};

// سجل الإجازات — آخر الطلبات وحالتها.
export default function LeaveHistoryCard({ requests, ar, t }) {
  const items = [...(requests || [])].slice(-6).reverse();
  return (
    <OverviewCard title={ar ? "سجل الإجازات" : "Leave history"} icon={CalendarDays}>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{ar ? "لا توجد طلبات إجازة" : "No leave requests"}</p>
      ) : (
        items.map((request) => (
          <div key={request.id} className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
            <span className="shrink-0 text-sm font-medium">{t(request.type)}</span>
            <span className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground" dir="ltr">{request.startDate} — {request.endDate}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${TONE[request.status || "pending"]}`}>{t(request.status || "pending")}</span>
          </div>
        ))
      )}
    </OverviewCard>
  );
}