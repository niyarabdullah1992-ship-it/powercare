import React, { useState } from "react";
import { assignmentHistoryNote, deriveTaskDailyPace, taskDailyPaceLabel, taskPoints } from "@/lib/opsDerivations";
import EscalationSteps from "@/components/escalation/EscalationSteps";
import { INK, MUTED, NAVY, NAVY_FILL, OK, WARN, BAD, ACCENT, BRAND, field, CARD, SURFACE } from "@/lib/platformStyles";

/**
 * Platform isTaskDetail — L3369–3528 (inline styles AS-IS).
 * Keeps app log / approve / comment behaviour.
 */
export default function OpsTaskDetail({
  task,
  ar,
  busy,
  canManage,
  checkedIn,
  attendanceGate,
  escalationSteps = [],
  currentLevelLabel = "",
  t,
  lang,
  onClose,
  onLog,
  onApprove,
  onReject,
  onAddComment,
  onAddAttachment,
  canReassign = false,
  onOpenReassign,
}) {
  const [logAmount, setLogAmount] = useState(1);
  const [attest, setAttest] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [cDraft, setCDraft] = useState("");
  const [cIssue, setCIssue] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [attachFile, setAttachFile] = useState(null);

  if (!task) return null;

  const points = taskPoints(task.priority, task.effortWeight);
  const steps = Array.isArray(task.steps) ? task.steps : String(task.steps || "").split("\n").filter(Boolean);
  const attachments = Array.isArray(task.attachments) ? task.attachments : [];
  const comments = Array.isArray(task.comments) ? task.comments : [];
  const doneN = Number(task.completedCount) || 0;
  const targetN = Math.max(1, Number(task.targetCount) || 1);
  const pace = deriveTaskDailyPace(task);
  const awaiting = task.status === "awaiting_approval" || (doneN >= targetN && !task.approvedAt && task.status !== "completed");
  const approved = task.status === "completed" || !!task.approvedAt;
  const hasProof = !!proofFile || attest.trim().length > 0;
  const onsiteBlocked = task.mode !== "remote" && checkedIn === false;
  const canLog = !approved && !awaiting && hasProof && !onsiteBlocked;
  const logBlockReason = !hasProof
    ? (ar
      ? "لا نقطة بلا أثر — أرفق صورة أو اكتب إفادة أولًا."
      : "No point without a trace — attach a photo or write an attestation first.")
    : onsiteBlocked
      ? (attendanceGate?.reason || (ar
        ? "تسجيل الإنجاز الميداني موقوف حتى بصمة اليوم."
        : "On-site logging is blocked until today's check-in."))
      : "";

  const weightLabel = ar ? "وزن" : "weight";
  const modeLabel = task.mode === "remote"
    ? (ar ? "عن بُعد" : "Remote")
    : (ar ? "ميداني" : "On-site");
  const statusLabel = awaiting
    ? (ar ? "بانتظار الاعتماد" : "Awaiting approval")
    : approved
      ? (ar ? "مكتملة" : "Completed")
      : (ar ? "نشطة" : "Active");
  const statusStyle = awaiting ? WARN : approved ? OK : NEUTRAL_PILL;
  const progPct = Math.min(100, Math.round((doneN / targetN) * 100));

  const inputStyle = { ...field };

  const fileChip = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #E2E8F0",
    background: SURFACE,
  };

  const pdfKind = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "10px",
    fontWeight: 600,
    background: "#FEF2F2",
    color: "#DC2626",
    border: "1px solid #FECACA",
    flexShrink: 0,
  };

  const logStyle = canLog
    ? {
      padding: "9px 16px",
      borderRadius: "9px",
      background: BRAND,
      color: "#fff",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: busy ? "wait" : "pointer",
      fontFamily: "inherit",
      opacity: busy ? 0.6 : 1,
    }
    : {
      padding: "9px 16px",
      borderRadius: "9px",
      background: "#E2E8F0",
      color: MUTED,
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "not-allowed",
      fontFamily: "inherit",
    };

  const issueBtnStyle = cIssue
    ? {
      height: "38px",
      padding: "0 13px",
      borderRadius: "9px",
      border: "1px solid #FECACA",
      background: "#FEF2F2",
      color: "#DC2626",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "inherit",
    }
    : {
      height: "38px",
      padding: "0 13px",
      borderRadius: "9px",
      border: "1px solid #E2E8F0",
      background: CARD,
      color: MUTED,
      fontSize: "12px",
      cursor: "pointer",
      fontFamily: "inherit",
    };

  const cSendStyle = cDraft.trim()
    ? {
      height: "38px",
      padding: "0 16px",
      borderRadius: "9px",
      background: BRAND,
      color: "#fff",
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: busy ? "wait" : "pointer",
      fontFamily: "inherit",
    }
    : {
      height: "38px",
      padding: "0 16px",
      borderRadius: "9px",
      background: "#E2E8F0",
      color: MUTED,
      border: "none",
      fontSize: "12px",
      fontWeight: 600,
      cursor: "not-allowed",
      fontFamily: "inherit",
    };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        background: "rgba(20,40,75,.42)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
      onClick={onClose}
      dir={ar ? "rtl" : "ltr"}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "620px",
          maxHeight: "calc(100vh - 48px)",
          background: CARD,
          borderRadius: "18px",
          boxShadow: "0 24px 60px rgba(20,40,75,.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ flexShrink: 0, padding: "18px 20px 14px", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 600, textWrap: "pretty", color: NAVY }}>{task.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "7px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: MUTED, fontFamily: "'IBM Plex Mono',monospace" }} dir="ltr">{task.ref}</span>
                <span style={tagSoft}>×{task.effortWeight || 1} {weightLabel}</span>
                <span style={tagSoft}>{modeLabel}</span>
                <span style={statusStyle}>{statusLabel}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                border: "1px solid #E2E8F0",
                background: CARD,
                color: MUTED,
                fontSize: "14px",
                cursor: "pointer",
                fontFamily: "inherit",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: MUTED }}>
              {task.stationName || task.stationId || "—"} · {task.ownerName || task.assigneeName || "—"}
            </span>
            {canReassign && (
              <button
                type="button"
                disabled={busy}
                onClick={() => onOpenReassign?.()}
                style={{
                  padding: "4px 10px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  background: CARD,
                  color: NAVY,
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: busy ? "wait" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                {ar ? "توكيل" : "Delegate"}
              </button>
            )}
            <span style={{ fontSize: "12px", color: MUTED }}>
              {task.dueAt ? String(task.dueAt).slice(0, 10) : "—"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "7px", flex: 1, minWidth: "120px" }}>
              <span style={{ flex: 1, height: "5px", borderRadius: "4px", background: "#F1F5F9", overflow: "hidden" }}>
                <span style={{ display: "block", width: `${progPct}%`, height: "100%", background: ACCENT, borderRadius: "4px" }} />
              </span>
              <span style={{ fontSize: "11px", color: MUTED, textAlign: "right", whiteSpace: "nowrap" }}>
                <span dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif" }}>{doneN}/{targetN}</span>
                {pace.daily != null ? (
                  <span style={{ marginInlineStart: 6, color: pace.overdue ? "#B45309" : ACCENT, fontWeight: 600 }}>
                    {ar ? `${pace.daily}/يوم` : `${pace.daily}/day`}
                  </span>
                ) : null}
              </span>
            </span>
          </div>
          <div style={{ fontSize: "11px", color: MUTED, marginTop: "8px", lineHeight: 1.6 }}>
            {taskDailyPaceLabel(pace, ar)}
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {Array.isArray(task.assignmentHistory) && task.assignmentHistory.length > 0 && (
            <div style={{
              border: "1px solid #E2E8F0",
              background: SURFACE,
              borderRadius: "12px",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
            >
              {task.assignmentHistory.map((entry, i) => (
                <div
                  key={`${entry.at || i}-${entry.toId || i}`}
                  style={{ fontSize: "12px", color: NAVY, lineHeight: 1.65, textWrap: "pretty" }}
                >
                  {assignmentHistoryNote(entry, ar ? "ar" : "en")}
                </div>
              ))}
            </div>
          )}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED }}>
              {ar ? "خطوات التنفيذ" : "Execution steps"}
            </div>
            {steps.length === 0 ? (
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "8px" }}>
                {ar ? "لم تُحدَّد خطوات لهذه المهمة." : "No steps were defined for this task."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "10px" }}>
                {steps.map((s, i) => (
                  <div key={`${task.id}-step-${i}`} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span
                      dir="ltr"
                      style={{
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "#F1F5F9",
                        color: MUTED,
                        fontSize: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontFamily: "'IBM Plex Sans',sans-serif",
                        marginTop: "1px",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ fontSize: "13px", color: NAVY, lineHeight: 1.6, textWrap: "pretty" }}>{s}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED }}>
              {ar ? "المرفقات" : "Attachments"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px", alignItems: "center" }}>
              {attachments.map((f, i) => (
                <a
                  key={`${task.id}-att-${i}`}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ ...fileChip, textDecoration: "none", cursor: "pointer" }}
                >
                  <span style={pdfKind}>{(f.name || "").toLowerCase().endsWith(".pdf") ? "PDF" : "FILE"}</span>
                  <span style={{ fontSize: "12px", color: NAVY }}>{f.name || "file"}</span>
                </a>
              ))}
              <label style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                padding: "8px 13px",
                borderRadius: "10px",
                border: "1px dashed #CBD5E1",
                background: CARD,
                fontSize: "12px",
                color: MUTED,
                cursor: "pointer",
              }}
              >
                <span>{ar ? "أرفق ملفًا" : "Attach file"}</span>
                <input
                  type="file"
                  style={{ display: "none" }}
                  onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                />
              </label>
              {attachFile && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await onAddAttachment?.(attachFile);
                    setAttachFile(null);
                  }}
                  style={{
                    padding: "8px 13px",
                    borderRadius: "9px",
                    background: BRAND,
                    color: "#fff",
                    border: "none",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    opacity: busy ? 0.5 : 1,
                  }}
                >
                  {ar ? `رفع ${attachFile.name}` : `Upload ${attachFile.name}`}
                </button>
              )}
            </div>
            {attachments.length === 0 && !attachFile && (
              <div style={{ fontSize: "12px", color: MUTED, marginTop: "8px" }}>
                {ar ? "لا مرفقات بعد — أرفق مواصفة أو إجراءً يحتاجه المنفّذ." : "No attachments yet — attach a spec or procedure the executor needs."}
              </div>
            )}
          </div>

          {awaiting && !approved && (
            <div style={{ border: "1px solid #FDE68A", background: "#FFFBEB", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#B45309" }}>
                {canManage
                  ? (ar ? "بانتظار اعتمادك" : "Awaiting your approval")
                  : (ar ? "بانتظار اعتماد المستوى الحالي" : "Awaiting the current level")}
              </div>
              <div style={{ fontSize: "12px", color: "#92400E", marginTop: "5px", lineHeight: 1.65, textWrap: "pretty" }}>
                {ar
                  ? `اكتمل العدد ${targetN}/${targetN} وأُرفق الإثبات. اعتماد المدير يمنح ${points} نقطة ويُقفل أمر العمل. الرفض يُصعَّد للأعلى.`
                  : `${targetN}/${targetN} logged with proof. Manager approval grants ${points} points and closes the work order. A reject escalates upward.`}
                {currentLevelLabel ? (ar ? ` المستوى الحالي: ${currentLevelLabel}.` : ` Current level: ${currentLevelLabel}.`) : ""}
              </div>
              {Array.isArray(escalationSteps) && escalationSteps.length > 0 && t && (
                <div style={{ marginTop: "10px" }}>
                  <EscalationSteps steps={escalationSteps} t={t} lang={lang || (ar ? "ar" : "en")} />
                </div>
              )}
              {canManage ? (
                <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onApprove?.()}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "9px",
                      background: "#1E9E63",
                      color: "#fff",
                      border: "none",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      opacity: busy ? 0.5 : 1,
                    }}
                  >
                    {ar ? "اعتمد الإنجاز" : "Approve completion"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRejectOpen(true)}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "9px",
                      background: CARD,
                      color: "#B45309",
                      border: "1px solid #FDE68A",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {ar ? "رفض — يُصعَّد" : "Reject — escalate"}
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: "11px", color: "#B45309", marginTop: "8px" }}>
                  {ar ? "بانتظار اعتماد المشرف — لا تُمنح النقاط قبل الاعتماد." : "Waiting for supervisor approval — points are not granted before approval."}
                </div>
              )}
              {rejectOpen && (
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={ar ? "سبب الرفض (مطلوب) — يُصعَّد للمستوى التالي" : "Rejection reason (required) — escalates to the next level"}
                    style={{
                      width: "100%",
                      border: "1px solid #FECACA",
                      borderRadius: "9px",
                      background: CARD,
                      padding: "9px 12px",
                      fontSize: "12px",
                      color: NAVY,
                      fontFamily: "inherit",
                      resize: "vertical",
                      boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setRejectOpen(false)}
                      style={{
                        padding: "7px 13px",
                        borderRadius: "9px",
                        border: "1px solid #E2E8F0",
                        background: CARD,
                        color: MUTED,
                        fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {ar ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || !rejectReason.trim()}
                      onClick={() => onReject?.(rejectReason.trim())}
                      style={{
                        padding: "7px 13px",
                        borderRadius: "9px",
                        border: "none",
                        background: NAVY_FILL,
                        color: "#fff",
                        fontSize: "11px",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        opacity: busy || !rejectReason.trim() ? 0.5 : 1,
                      }}
                    >
                      {ar ? "رفض وتصعيد" : "Reject & escalate"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {approved && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              border: "1px solid #BBF7D0",
              background: "#ECFDF3",
              borderRadius: "12px",
              padding: "13px 16px",
            }}
            >
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#1E9E63", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "#15803D", lineHeight: 1.65, textWrap: "pretty" }}>
                {ar
                  ? `اعتُمد الإنجاز ومُنحت ${task.pointsAwarded ?? points} نقطة — دخلت في نسبة الأداء وسجل التدقيق.`
                  : `Completion approved and ${task.pointsAwarded ?? points} points granted — in the performance score and audit trail.`}
              </span>
            </div>
          )}

          {!approved && !awaiting && (
            <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: MUTED }}>
                {ar ? "تسجيل الإنجاز" : "Log completion"}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: MUTED }}>{ar ? "العدد المنجز" : "Quantity"}</span>
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, targetN - doneN)}
                    value={logAmount}
                    onChange={(e) => setLogAmount(Number(e.target.value) || 1)}
                    style={{ ...inputStyle, width: "88px" }}
                  />
                </label>
                <label style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  height: "38px",
                  padding: "0 13px",
                  borderRadius: "9px",
                  border: "1px dashed #CBD5E1",
                  background: CARD,
                  fontSize: "12px",
                  color: MUTED,
                  cursor: "pointer",
                }}
                >
                  <span>{ar ? "أرفق ملفًا" : "Attach file"}</span>
                  <input type="file" style={{ display: "none" }} onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </label>
                <button
                  type="button"
                  disabled={busy || !canLog}
                  onClick={() => onLog?.({ amount: logAmount, proofFile, attestation: attest.trim() })}
                  style={logStyle}
                >
                  {ar ? "سجّل الإنجاز" : "Log completion"}
                </button>
              </div>
              {proofFile && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: NAVY }}>{proofFile.name}</div>
              )}
              <textarea
                value={attest}
                onChange={(e) => setAttest(e.target.value)}
                rows={2}
                placeholder={ar ? "أثر غير مصوَّر: من يشهد، وماذا أُنجز بالضبط…" : "Non-photographed evidence: who attests, and exactly what was done…"}
                style={{
                  width: "100%",
                  marginTop: "10px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "9px",
                  background: SURFACE,
                  padding: "9px 12px",
                  fontSize: "12px",
                  color: NAVY,
                  fontFamily: "inherit",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ fontSize: "11px", color: MUTED, marginTop: "8px", lineHeight: 1.65, textWrap: "pretty" }}>
                {ar
                  ? "لا نقطة بلا أثر — أرفق صورة الإنجاز، أو اكتب أثرًا غير مصوَّر."
                  : "No point without a trace — attach a completion photo, or write a non-photographed attestation."}
              </div>
              {!canLog && logBlockReason && (
                <div style={{ fontSize: "11px", color: "#B91C1C", marginTop: "8px", lineHeight: 1.65 }}>{logBlockReason}</div>
              )}
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "14px 16px",
            borderRadius: "12px",
            background: NAVY_FILL,
            color: "#fff",
            flexWrap: "wrap",
          }}
          >
            <div>
              <div style={{ fontSize: "10px", color: "#6EE7B7", letterSpacing: "0.1em", fontWeight: 600 }}>
                {ar ? "قيمة المهمة بالنقاط" : "TASK WORTH"}
              </div>
              <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "30px", fontWeight: 600, lineHeight: 1, marginTop: "6px", textAlign: "right" }}>
                {points}
              </div>
            </div>
            <div style={{ flex: "1 1 220px", fontSize: "12px", color: "#A8B4C8", lineHeight: 1.65, textWrap: "pretty" }}>
              {approved
                ? (ar
                  ? `اعتُمد الإنجاز ومُنحت ${task.pointsAwarded ?? points} نقطة — دخلت في نسبة الأداء وسجل التدقيق.`
                  : `Completion approved and ${task.pointsAwarded ?? points} points granted — in the performance score and audit trail.`)
                : (ar
                  ? "النقاط = قيمة الأولوية × وزن الجهد — تُمنح بعد اعتماد المشرف للإثبات، لا عند تسجيل الإنجاز."
                  : "Points = priority × effort — granted after supervisor approves the proof, not when completion is logged.")}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#A8B4C8" }}>
                {ar ? "المحادثة" : "Discussion"}
              </div>
              <div style={{ fontSize: "11px", color: "#A8B4C8" }}>{comments.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "10px" }}>
              {comments.length === 0 && (
                <div style={{ fontSize: "12px", color: MUTED }}>{ar ? "لا تعليقات بعد." : "No comments yet."}</div>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  style={{
                    borderRadius: "10px",
                    border: c.isIssue ? "1px solid #FECACA" : "1px solid #E2E8F0",
                    background: c.isIssue ? "#FEF2F2" : "#F7F8FA",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: NAVY }}>{c.authorName}</span>
                    {c.isIssue && <span style={BAD}>{ar ? "عائق" : "Blocker"}</span>}
                    <span style={{ flex: 1 }} />
                    <span dir="ltr" style={{ fontSize: "10px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right" }}>
                      {c.at ? String(c.at).slice(0, 16).replace("T", " ") : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: INK, lineHeight: 1.65, marginTop: "5px", textWrap: "pretty" }}>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {task.rejectReason && !approved && (
            <div style={{ borderRadius: "10px", border: "1px solid #FECACA", background: "#FEF2F2", padding: "10px 12px", fontSize: "12px", color: "#B91C1C" }}>
              {ar ? "سبب الرفض:" : "Rejection reason:"} {task.rejectReason}
            </div>
          )}
        </div>

        <div style={{
          flexShrink: 0,
          padding: "14px 20px 18px",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
          background: CARD,
        }}
        >
          <input
            value={cDraft}
            onChange={(e) => setCDraft(e.target.value)}
            placeholder={ar ? "اكتب تحديثًا، أو سجّل عائقًا يمنع الإنجاز…" : "Write an update, or log a blocker…"}
            style={{ ...inputStyle, flex: "1 1 200px" }}
          />
          <button type="button" onClick={() => setCIssue((v) => !v)} style={issueBtnStyle}>
            {ar ? "علّمه عائقًا" : "Flag as blocker"}
          </button>
          <button
            type="button"
            disabled={busy || !cDraft.trim()}
            onClick={async () => {
              await onAddComment?.(cDraft.trim(), cIssue);
              setCDraft("");
              setCIssue(false);
            }}
            style={cSendStyle}
          >
            {ar ? "أرسل" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

const NEUTRAL_PILL = {
  display: "inline-block",
  padding: "3px 9px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 500,
  background: SURFACE,
  color: MUTED,
  border: "1px solid #E2E8F0",
  whiteSpace: "nowrap",
};

const tagSoft = {
  display: "inline-flex",
  alignItems: "center",
  padding: "2px 8px",
  borderRadius: "8px",
  fontSize: "11px",
  background: SURFACE,
  color: MUTED,
  border: "1px solid #E2E8F0",
};
