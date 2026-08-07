import React from "react";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";
import { formatDateTime } from "@/lib/dateFormat";

// Shared visual escalation ladder — used identically by Anonymous/Public Complaints
// and by task-rejection disputes, so the same chain "looks" the same everywhere.
// steps: [{ idx, label, hasHandler, state: 'done'|'current'|'pending', reply? }]
export default function EscalationSteps({ steps, t, lang }) {
  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("escalationChain")}</p>
      {steps.map((s) => (
        <div key={s.idx} className={`flex items-start gap-2 text-xs font-body ${s.state === "done" ? "opacity-50" : ""}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${s.reply ? "bg-accent text-accent-foreground" : s.state === "current" ? "bg-amber-100 text-amber-700 border border-amber-300" : "bg-muted text-muted-foreground"}`}>
            {s.reply ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[9px]">{s.idx + 1}</span>}
          </div>
          <div className="flex-1">
            <p className={`font-medium flex items-center gap-1.5 ${s.state === "current" ? "text-foreground" : "text-muted-foreground"}`}>
              {s.label}
              {s.state === "current" && !s.reply && <span className="text-amber-600 font-normal">— {t("waitingReply")}</span>}
              {!s.hasHandler && s.state !== "done" && (
                <span title={t("noHandlerAssigned")} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-700 border border-red-300">
                  <AlertTriangle className="w-2.5 h-2.5" /> {t("noHandlerAssigned")}
                </span>
              )}
            </p>
            {s.reply && (
              <div className="mt-0.5 p-2 rounded bg-muted/50">
                <p className="text-[10px] text-muted-foreground">{s.reply.authorName} · {formatDateTime(s.reply.createdAt, lang)}</p>
                <p className="text-foreground mt-0.5">{s.reply.text}</p>
                <CommentAttachments files={s.reply.files} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}