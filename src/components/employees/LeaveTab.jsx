import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { submitLeaveRequest, setLeaveRequestStatus } from "@/lib/store";
import { Send } from "lucide-react";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import LeaveBalanceCard from "@/components/employees/LeaveBalanceCard";
import LeaveRequestItem from "@/components/employees/LeaveRequestItem";

const TYPES = ["annual", "sick", "unpaid"];

export default function LeaveTab({ employee, companyId, currentUser, isSelf, canApprove }) {
  const { t } = useI18n();
  const [type, setType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState([]);
  const requests = employee.leaveRequests || [];

  const submit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    submitLeaveRequest(companyId, employee.id, { type, startDate, endDate, reason, files });
    setStartDate(""); setEndDate(""); setReason(""); setFiles([]);
  };

  const decide = (id, status) => setLeaveRequestStatus(companyId, employee.id, id, status, currentUser.name);

  return (
    <div className="space-y-4">
      <LeaveBalanceCard balance={employee.profile?.leaveBalance} />

      {isSelf && (
        <form onSubmit={submit} className="p-5 rounded-xl border border-border bg-card space-y-3">
          <h3 className="font-heading font-semibold">{t("submitRequest")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="px-3 py-2 rounded-md border border-input text-sm font-body">
              {TYPES.map((ty) => <option key={ty} value={ty}>{t(ty)}</option>)}
            </select>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="px-3 py-2 rounded-md border border-input text-sm font-body" />
          </div>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("reason")} rows={2} className="w-full px-3 py-2 rounded-md border border-input text-sm font-body resize-none" />
          <div className="flex flex-wrap items-end gap-2">
            <CommentFiles files={files} setFiles={setFiles} />
            <VoiceRecorder files={files} setFiles={setFiles} />
          </div>
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