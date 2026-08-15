import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { submitLeaveRequest, setLeaveRequestStatus } from "@/lib/store";
import { Send } from "lucide-react";
import CommentFiles from "@/components/tasks/CommentFiles";
import VoiceRecorder from "@/components/tasks/VoiceRecorder";
import LeaveBalanceCard from "@/components/employees/LeaveBalanceCard";
import LeaveTotalsEditor from "@/components/employees/LeaveTotalsEditor";
import LeaveRequestItem from "@/components/employees/LeaveRequestItem";
import { LEAVE_TYPES, LEAVE_THRESHOLD_DAYS, computeDays, leaveTypesForProfile } from "@/lib/leaveTypes";
import { checkApproveLeaveGate } from "@/lib/leaveDerivations";
import { generateAbsenceDeduction } from "@/lib/deductionGenerators";
import { base44 } from "@/api/base44Client";
import { MUTED, NAVY, NAVY_FILL, field, CARD } from "@/lib/platformStyles";

async function workforce(payload) {
  const res = await base44.functions.invoke("workforce", payload);
  return res?.data ?? res;
}

/** Platform leave tab primary = balances (L2695–2710). Request UI is app secondary. */
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
  const leaveTypes = leaveTypesForProfile(employee.profile);

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

  const inputStyle = { ...field };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }} dir={ar ? "rtl" : "ltr"}>
      <LeaveBalanceCard profile={employee.profile} requests={requests} />

      {(isSelf || canApprove || requests.length > 0) && (
        <details style={{
          background: CARD,
          border: "1px solid #E2E8F0",
          borderRadius: "16px",
          padding: "14px 18px",
        }}
        >
          <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: NAVY, listStyle: "none" }}>
            {ar ? "طلبات الإجازة وإدارة الأرصدة" : "Leave requests and balance admin"}
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "14px" }}>
            {canApprove && <LeaveTotalsEditor employee={employee} companyId={companyId} />}

            {isSelf && (
              <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{t("submitRequest")}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "10px" }}>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                    {leaveTypes.map((ty) => <option key={ty.key} value={ty.key}>{t(ty.key)}</option>)}
                  </select>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required style={inputStyle} />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={inputStyle} />
                </div>
                {days > 0 && (
                  <div style={{ fontSize: "12px", color: MUTED }}>{t("daysRequested")}: {days}</div>
                )}
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("reason")}
                  rows={2}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "10px 11px",
                    resize: "vertical",
                    borderColor: needsReason && !reason.trim() ? "#DC2626" : "#E2E8F0",
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
                  <CommentFiles files={files} setFiles={setFiles} />
                  <VoiceRecorder files={files} setFiles={setFiles} />
                </div>
                {typeConfig?.requiresFile && (
                  <div style={{ fontSize: "12px", color: MUTED }}>{t("medicalReport")} — {t("attachmentRequired")}</div>
                )}
                {overThreshold && (
                  <div style={{ fontSize: "12px", color: "#B45309" }}>{t("thresholdNote")} {LEAVE_THRESHOLD_DAYS} {t("days")}</div>
                )}
                {error && <div style={{ fontSize: "12px", color: "#DC2626" }}>{error}</div>}
                <button
                  type="submit"
                  style={{
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 15px",
                    borderRadius: "9px",
                    border: "none",
                    background: NAVY_FILL,
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <Send style={{ width: 14, height: 14 }} /> {t("submitRequest")}
                </button>
              </form>
            )}

            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY, marginBottom: "10px" }}>{t("leaveRequests")}</div>
              {error && !isSelf && <div style={{ fontSize: "12px", color: "#DC2626", marginBottom: "8px" }}>{error}</div>}
              {requests.length === 0 ? (
                <div style={{ fontSize: "13px", color: MUTED }}>{t("noLeaveRequests")}</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {requests.map((r) => (
                    <LeaveRequestItem key={r.id} request={r} canApprove={canApprove} onDecide={decide} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}
