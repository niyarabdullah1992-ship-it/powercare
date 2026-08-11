import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { submitLeaveRequest, setLeaveRequestStatus } from "@/lib/store";
import { Send } from "lucide-react";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import LeaveBalanceCard from "@/components/employees/LeaveBalanceCard";
import LeaveTotalsEditor from "@/components/employees/LeaveTotalsEditor";
import LeaveRequestItem from "@/components/employees/LeaveRequestItem";
import { LEAVE_TYPES, LEAVE_THRESHOLD_DAYS, computeDays } from "@/lib/leaveTypes";
import { checkApproveLeaveGate } from "@/lib/leaveDerivations";
import { generateAbsenceDeduction } from "@/lib/deductionGenerators";
import { base44 } from "@/api/base44Client";

async function workforce(payload) {
  const res = await base44.functions.invoke("workforce", payload);
  return res?.data ?? res;
}

export default function LeaveTab({ employee, companyId, currentUser, isSelf, canApprove }) {
  const { t, lang } = useI18n();
  const ar = lang === "ar";
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

  const decide = async (id, status) => {
    const request = requests.find((r) => r.id === id);
    if (status === "approved") {
      const gate = checkApproveLeaveGate(request, !!LEAVE_TYPES.find((ty) => ty.key === request?.type)?.requiresFile);
      if (!gate.ok) {
        setError(ar ? gate.reason : "Approval blocked — attachment required for requests over 5 days.");
        return;
      }
    }
    try {
      const remote = await workforce({
        action: status === "approved" ? "approveLeave" : "rejectLeave",
        companyId,
        employeeId: employee.id,
        requestId: id,
      });
      if (remote?.error === "ATTACHMENT_REQUIRED") {
        setError(ar ? remote.reason : (remote.reasonEn || remote.reason));
        return;
      }
    } catch {
      // Fall through to local store when function is unavailable.
    }
    setLeaveRequestStatus(companyId, employee.id, id, status, currentUser.name);
    if (status === "approved" && request?.type === "unpaid") {
      generateAbsenceDeduction(companyId, employee.id, id, request.days || computeDays(request.startDate, request.endDate), currentUser);
    }
  };

  return (
    <div className="space-y-4">
      <LeaveBalanceCard profile={employee.profile} requests={requests} />
      {canApprove && <LeaveTotalsEditor employee={employee} companyId={companyId} />}

      {isSelf && (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-heading font-semibold">{t("submitRequest")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body">
              {LEAVE_TYPES.map((ty) => <option key={ty.key} value={ty.key}>{t(ty.key)}</option>)}
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
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
        {error && !isSelf && <p className="text-xs text-destructive font-body">{error}</p>}
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
