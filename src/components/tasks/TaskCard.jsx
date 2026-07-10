import React from "react";
import { Check, AlertTriangle, Clock, MessageCircle, Send, Pencil, Trash2 } from "lucide-react";
import CommentFiles, { CommentAttachments } from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import { formatDateTime } from "@/lib/dateFormat";
import { NO_SECTION } from "@/lib/taskFolders";

// A single task target card — progress, comments, and management actions.
export default function TaskCard({
  tg, t, dir, lang, assignmentLabel, canManage, canLog,
  logTarget, logAmount, setLogTarget, setLogAmount, logCompleted,
  commentsOpen, setCommentsOpen, commentText, setCommentText, commentFiles, setCommentFiles, submitComment,
  markIssue, setMarkIssue,
  allSectionFolders, moveTaskToSection, setEditTarget, deleteTarget,
}) {
  const pct = Math.min(Math.round((tg.completed_tasks / tg.task_target) * 100), 100);
  const daysLeft = Math.ceil((new Date(tg.end_date).getTime() - Date.now()) / 86400000);
  const done = tg.status === "completed";
  const overdue = tg.status === "overdue";
  const canLogThis = canLog;
  const isUrgent = tg.priority === "urgent";
  const totalDur = new Date(tg.end_date).getTime() - new Date(tg.start_date).getTime();
  const elapsed = Date.now() - new Date(tg.start_date).getTime();
  const timePct = totalDur > 0 ? (elapsed / totalDur) * 100 : 0;
  const progressPct = tg.task_target > 0 ? (tg.completed_tasks / tg.task_target) * 100 : 0;
  const atRisk = isUrgent && !done && !overdue && timePct > 75 && progressPct < 50;
  const statusBadge = done
    ? "bg-emerald-100 text-emerald-700 border-emerald-300"
    : overdue
    ? "bg-red-100 text-red-700 border-red-300"
    : "bg-amber-100 text-amber-700 border-amber-300";
  const cardBorder = overdue
    ? "border-red-300 bg-red-50/40"
    : done
    ? "border-emerald-300 bg-emerald-50/30"
    : isUrgent
    ? "border-red-400 bg-red-50/20"
    : "border-border bg-background";
  const barColor = done
    ? "bg-emerald-500"
    : overdue
    ? "bg-red-500"
    : pct >= 67
    ? "bg-emerald-500"
    : pct >= 34
    ? "bg-amber-500"
    : "bg-yellow-400";

  return (
    <div className={`p-4 rounded-lg border space-y-3 transition-colors ${cardBorder}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium font-body">{tg.title || t("setTarget")}</p>
          {tg.description && <p className="text-xs text-muted-foreground font-body mt-0.5">{tg.description}</p>}
          {tg.steps && (
            <div className="text-xs text-muted-foreground font-body mt-1 p-2 rounded bg-muted/50 whitespace-pre-wrap">
              <span className="font-medium">{t("steps")}:</span>{"\n"}{tg.steps}
            </div>
          )}
          {(Array.isArray(tg.file_urls) ? tg.file_urls.length : tg.file_url) > 0 && (
            <div className="mt-1">
              <CommentAttachments files={Array.isArray(tg.file_urls) && tg.file_urls.length ? tg.file_urls : [{ url: tg.file_url, name: "PDF", type: "file" }]} />
            </div>
          )}
          <p className="text-xs text-muted-foreground font-body mt-1">{assignmentLabel}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-medium border border-red-500 bg-red-100 text-red-700 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3" /> {t("urgent")}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-body font-medium border whitespace-nowrap ${statusBadge}`}>
            {done ? <Check className="w-3 h-3" /> : overdue ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
            {done ? t("completed") : overdue ? t("overdue") : t("inProgress")}
          </span>
          {canManage && (
            <div className="flex items-center gap-1 mt-1">
              <select
                value={tg.section || NO_SECTION}
                onChange={(e) => moveTaskToSection(tg, e.target.value)}
                title={t("moveToSection")}
                className="text-[11px] px-1.5 py-1 rounded-md border border-input bg-card font-body max-w-[130px]"
              >
                {allSectionFolders.map((f) => (
                  <option key={f.key} value={f.key}>{f.name}</option>
                ))}
              </select>
              <button onClick={() => setEditTarget(tg)} className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground" title={t("edit")}>
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <ConfirmDeleteDialog
                onConfirm={() => deleteTarget(tg.id)}
                description={t("confirmDeleteTask")}
                trigger={
                  <button className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600" title={t("delete")}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-xs font-body">
        {done ? (
          <span className="text-emerald-600 font-medium">{t("targetDone")}</span>
        ) : overdue ? (
          <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("overdue")}</span>
        ) : atRisk ? (
          <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t("atRisk")}</span>
        ) : (
          <span className={`flex items-center gap-1 ${daysLeft <= 3 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            <Clock className="w-3 h-3" /> {t("daysLeft")}: {daysLeft}
          </span>
        )}
      </div>
      <div>
        <div className="flex justify-between text-xs font-body mb-1">
          <span className="text-muted-foreground">{t("completedCount")}: {tg.completed_tasks}/{tg.task_target} {t("tasksUnit")}</span>
          <span className="font-medium">{pct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className={`h-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {canLogThis && !done && !overdue && (
        <div className="flex items-center gap-2 pt-1">
          <input type="number" min="1" value={logTarget === tg.id ? logAmount : 1} onChange={(e) => { setLogTarget(tg.id); setLogAmount(e.target.value); }} className="w-20 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
          <button onClick={() => logCompleted(tg.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-accent-foreground text-xs font-body">
            <Check className="w-3.5 h-3.5" /> {t("logCompleted")}
          </button>
        </div>
      )}

      <div className="pt-2 border-t border-border">
        <button onClick={() => { const next = commentsOpen === tg.id ? null : tg.id; setCommentsOpen(next); setCommentText(""); setCommentFiles([]); setMarkIssue(false); }} className="flex items-center gap-1.5 text-xs text-muted-foreground font-body hover:text-foreground">
          <MessageCircle className="w-3.5 h-3.5" /> {t("comments")} ({Array.isArray(tg.comments) ? tg.comments.length : 0})
        </button>
        {commentsOpen === tg.id && (
          <div className="mt-2 space-y-2">
            {Array.isArray(tg.comments) && tg.comments.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {tg.comments.map((c) => (
                  <div key={c.id} className={`text-xs font-body p-2 rounded-md ${c.is_issue ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground flex items-center gap-1">
                        {c.user_name}
                        {c.is_issue && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-red-100 text-red-700 border border-red-300">
                            <AlertTriangle className="w-2.5 h-2.5" /> {t("stoppageIssue")}
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-muted-foreground">{c.created_at ? formatDateTime(c.created_at, lang) : ""}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 whitespace-pre-wrap">{c.content}</p>
                    <CommentAttachments files={c.files} />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-2">
                <CommentFiles files={commentFiles} setFiles={setCommentFiles} />
                <VoiceRecorder files={commentFiles} setFiles={setCommentFiles} />
              </div>
              <div className="flex items-center gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder={t("writeComment")} className="flex-1 px-2 py-1.5 rounded-md border border-input text-xs font-body" />
                <button onClick={() => submitComment(tg.id)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-xs font-body">
                  <Send className="w-3.5 h-3.5" /> {t("send")}
                </button>
              </div>
              {!done && (
                <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body cursor-pointer">
                  <input type="checkbox" checked={!!markIssue} onChange={(e) => setMarkIssue(e.target.checked)} className="rounded border-input" />
                  <AlertTriangle className="w-3 h-3" /> {t("markAsIssue")}
                </label>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}