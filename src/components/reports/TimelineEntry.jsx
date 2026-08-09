import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ListTodo, CornerDownLeft, MessageSquare, Building2, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dateFormat";
import TaskStatusBadge from "@/components/reports/TaskStatusBadge";

const ICONS = { task: ListTodo, issue: AlertTriangle, complaint: MessageSquare, action: CornerDownLeft };

// One moment of the day: what happened, and what was done about it.
export default function TimelineEntry({ entry }) {
  const { t, lang } = useI18n();
  const Icon = ICONS[entry.kind] || ListTodo;
  const isIssue = entry.kind === "issue" || entry.kind === "complaint";
  const time = formatDateTime(entry.at, lang).split(" ").slice(-2).join(" ");

  return (
    <div className="flex gap-3">
      <div className="w-[76px] shrink-0 pt-3 text-xs font-body text-muted-foreground text-end">{time}</div>
      <div className="relative flex-1 pb-3">
        <span className="absolute -start-3 top-4 bottom-0 w-px bg-border" aria-hidden />
        <div className={`rounded-lg border p-3 ${isIssue ? "border-red-200 bg-red-50/60" : "border-border/60 bg-card"}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground font-body flex items-center gap-1 min-w-0">
              <Building2 className="w-3 h-3 shrink-0" /> <span className="truncate">{entry.stationName}</span>
              {entry.contextTitle && <span className="truncate">· {entry.contextTitle}</span>}
            </p>
            {entry.status && <TaskStatusBadge status={entry.status} t={t} />}
          </div>

          <p className="text-sm font-body mt-1 flex items-start gap-1.5">
            <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isIssue ? "text-destructive" : "text-accent"}`} />
            <span>
              {entry.label && <span className="font-medium">{entry.label}: </span>}
              {entry.text}
            </span>
          </p>
          {entry.impact && (
            <p className="text-xs font-body text-muted-foreground mt-1 ps-6">
              {lang === "ar" ? "الأثر: " : "Impact: "}{entry.impact}
            </p>
          )}

          {(entry.responses || []).map((r) => (
            <div key={r.id} className="mt-2 ps-6 border-s-2 border-accent/40">
              <p className="text-sm font-body ps-2">
                <span className="font-medium">{lang === "ar" ? "إجراء" : "Action"}: </span>{r.text}
                <span className="text-xs text-muted-foreground"> — {r.actor}</span>
              </p>
            </div>
          ))}

          {entry.href && (
            <Link to={entry.href} className="mt-2 inline-flex items-center gap-1 text-xs font-body text-accent-text hover:underline">
              <ExternalLink className="w-3 h-3" /> {entry.hrefLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}