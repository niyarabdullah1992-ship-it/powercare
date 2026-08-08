import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { submitLeaveRequest, setLeaveRequestStatus } from "@/lib/store";
import { Send } from "lucide-react";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import LeaveBalanceCard from "@/components/employees/LeaveBalanceCard";
import LeaveTotalsEditor from "@/components/employees/LeaveTotalsEditor";
import LeaveRequestItem from "@/components/employees/LeaveRequestItem";
import { LEAVE_TYPES, LEAVE_THRESHOLD_DAYS, computeDays, visibleLeaveTypes } from "@/lib/leaveTypes";

export default function LeaveTab({ employee, companyId, currentUser, isSelf, canApprove }) {
  const { t } = useI18n();
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const requests = employee.leaveRequests || [];

  const days = computeDays(startDate, endDate);
  const typeConfig = LEAVE_TYPES.find((ty) => ty.key === type);
  const overThreshold = days > LEAVE_THRESHOLD_DAYS;
  const needsFile = typeConfig?.requiresFile || overThreshold;
  const needsReason = overThreshold;

  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (!startDate || !endDate) return;
    if (needsReason && !reason.trim()) { setError(t("justificationRequired")); return; }
    if (needsFile && files.length === 0) { setError(t("attachmentRequired")); return; }
    submitLeaveRequest(companyId, employee.id, { type, startDate, endDate, reason, files });
    setStartDate(""); setEndDate(""); setReason(""); setFiles([]);
  };

  const decide = (id, status) => setLeaveRequestStatus(companyId, employee.id, id, status, currentUser.name);

  return (
    <div className="space-y-4">
      <LeaveBalanceCard profile={employee.profile} requests={requests} />
      {canApprove && <LeaveTotalsEditor employee={employee} companyId={companyId} />}

      {(isSelf || canApprove) && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">{t("submitRequest")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground font-body">{t("leaveType")}</span>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body">
                {visibleLeaveTypes(employee.profile).map((ty) => <option key={ty.key} value={ty.key}>{t(ty.key)}</option>)}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground font-body">{t("startDate")}</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </label>
            <label className="space-y-1">
              <span className="block text-xs text-muted-foreground font-body">{t("endDate")}</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full px-3 py-2 rounded-md border border-input text-sm font-body" />
            </label>
          </div>
          {days > 0 && (
            <p className="text-xs text-muted-foreground font-body">{t("daysRequested")}: {days}</p>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("reason")}
            rows={2}
            className={`w-full px-3 py-2 rounded-md border text-sm font-body resize-none ${needsReason && !reason.trim() ? "border-destructive" : "border-input"}`}
          />
          <div className="flex flex-wrap items-end gap-2">
            <CommentFiles files={files} setFiles={setFiles} />
            <VoiceRecorder files={files} setFiles={setFiles} />
          </div>
          {typeConfig?.requiresFile && (
            <p className="text-xs text-muted-foreground font-body">{t("medicalReport")} — {t("attachmentRequired")}</p>
          )}
          {overThreshold && (
            <p className="text-xs text-amber-600 font-body">{t("thresholdNote")} {LEAVE_THRESHOLD_DAYS} {t("days")}</p>
          )}
          {error && <p className="text-xs text-destructive font-body">{error}</p>}
          <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-md bg-foreground text-background text-sm font-body hover:bg-accent">
            <Send className="w-4 h-4" /> {t("submitRequest")}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <h3 className="font-heading font-semibold">{t("leaveRequests")}</h3>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">{t("noLeaveRequests")}</p>
        ) : (
          requests.map((r) => (
            <LeaveRequestItem key={r.id} request={r} canApprove={canApprove} onDecide={decide} />
          ))
        )}
      </div>
    </div>
  );
}