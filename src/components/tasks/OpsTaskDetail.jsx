import React, { useState } from "react";
import { taskPoints } from "@/lib/opsDerivations";

/**
 * Operations task card — steps, attachments, comments, completion log,
 * supervisor approval bar. Points shown as worth; granted only after approve.
 */
export default function OpsTaskDetail({
  task,
  ar,
  busy,
  canManage,
  checkedIn,
  attendanceGate,
  onClose,
  onLog,
  onApprove,
  onReject,
  onAddComment,
  onAddAttachment,
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#E2E8F0] bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{task.ref}</div>
            <h2 className="mt-0.5 text-[16px] font-semibold text-[#14284B]">{task.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-xs text-[#5A6B85]">
            {ar ? "إغلاق" : "Close"}
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="flex flex-wrap items-stretch gap-3 rounded-[14px] bg-[#14284B] px-4 py-3.5 text-white">
            <div>
              <div className="text-[10px] font-semibold tracking-[0.1em] text-[#6EE7B7]">
                {ar ? "قيمة المهمة بالنقاط" : "Task worth in points"}
              </div>
              <div className="mt-1 font-mono text-[30px] font-semibold leading-none" dir="ltr">{points}</div>
            </div>
            <div className="flex-1 text-[12px] leading-relaxed text-[#A8B4C8]">
              {approved
                ? (ar
                  ? `اعتُمد الإنجاز ومُنحت ${points} نقطة — دخلت في نسبة الأداء وسجل التدقيق.`
                  : `Completion approved and ${points} points granted — in the performance score and audit trail.`)
                : (ar
                  ? `النقاط = قيمة الأولوية × وزن الجهد — تُمنح بعد اعتماد المشرف للإثبات، لا عند تسجيل الإنجاز.`
                  : `Points = priority × effort — granted after supervisor approves the proof, not when completion is logged.`)}
            </div>
          </div>

          <section>
            <h3 className="text-[13px] font-semibold text-[#14284B]">{ar ? "خطوات التنفيذ" : "Execution steps"}</h3>
            {steps.length === 0 ? (
              <p className="mt-2 text-[12px] text-[#5A6B85]">
                {ar ? "لم تُحدَّد خطوات لهذه المهمة." : "No steps were defined for this task."}
              </p>
            ) : (
              <ol className="mt-2 space-y-1.5">
                {steps.map((s, i) => (
                  <li key={`${task.id}-step-${i}`} className="flex gap-2 text-[13px] text-[#14284B]">
                    <span className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{i + 1}.</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[13px] font-semibold text-[#14284B]">{ar ? "المرفقات" : "Attachments"}</h3>
              <label className="cursor-pointer rounded-lg border border-[#E2E8F0] px-2.5 py-1 text-[11px] text-[#5A6B85]">
                {ar ? "أرفق" : "Attach"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setAttachFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {attachFile && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  await onAddAttachment?.(attachFile);
                  setAttachFile(null);
                }}
                className="mt-2 rounded-lg bg-[#1E9E63] px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                {ar ? `رفع ${attachFile.name}` : `Upload ${attachFile.name}`}
              </button>
            )}
            {attachments.length === 0 ? (
              <p className="mt-2 text-[12px] text-[#5A6B85]">
                {ar ? "لا مرفقات بعد — أرفق مواصفة أو إجراءً يحتاجه المنفّذ." : "No attachments yet — attach a spec or procedure the executor needs."}
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {attachments.map((f, i) => (
                  <li key={`${task.id}-att-${i}`} className="rounded-lg border border-[#E2E8F0] bg-[#F7F8FA] px-2.5 py-1.5 text-[12px]">
                    <a href={f.url} target="_blank" rel="noreferrer" className="text-[#14284B] underline-offset-2 hover:underline">
                      {f.name || "file"}
                    </a>
                    {f.addedBy && (
                      <span className="ms-2 text-[10px] text-[#5A6B85]">{f.addedBy}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-[#14284B]">{ar ? "المحادثة" : "Discussion"}</h3>
            <div className="mt-2 space-y-2">
              {comments.length === 0 && (
                <p className="text-[12px] text-[#5A6B85]">{ar ? "لا تعليقات بعد." : "No comments yet."}</p>
              )}
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-[10px] border px-3 py-2 text-[12px] ${
                    c.isIssue ? "border-[#FECACA] bg-[#FEF2F2]" : "border-[#E2E8F0] bg-[#F7F8FA]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5A6B85]">
                    <span className="font-medium text-[#14284B]">{c.authorName}</span>
                    {c.isIssue && (
                      <span className="rounded-full border border-[#FECACA] bg-white px-1.5 py-0.5 text-[#B91C1C]">
                        {ar ? "عائق" : "Blocker"}
                      </span>
                    )}
                    <span className="font-mono" dir="ltr">{c.at ? String(c.at).slice(0, 16).replace("T", " ") : ""}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-[#14284B]">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-2">
              <textarea
                rows={2}
                value={cDraft}
                onChange={(e) => setCDraft(e.target.value)}
                placeholder={ar ? "اكتب تحديثًا، أو سجّل عائقًا يمنع الإنجاز…" : "Write an update, or log a blocker…"}
                className="w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[13px]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCIssue((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-[12px] ${
                    cIssue ? "border-[#FECACA] bg-[#FEF2F2] font-semibold text-[#DC2626]" : "border-[#E2E8F0] text-[#5A6B85]"
                  }`}
                >
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
                  className="rounded-lg bg-[#1E9E63] px-3 py-1.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#5A6B85]"
                >
                  {ar ? "أرسل" : "Send"}
                </button>
                {!cDraft.trim() && (
                  <span className="text-[11px] text-[#5A6B85]">{ar ? "اكتب نصًا قبل الإرسال." : "Write text before sending."}</span>
                )}
              </div>
            </div>
          </section>

          {!approved && !awaiting && (
            <section className="rounded-[14px] border border-[#E2E8F0] p-4">
              <h3 className="text-[13px] font-semibold text-[#14284B]">{ar ? "تسجيل الإنجاز" : "Log completion"}</h3>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5A6B85]">
                {ar
                  ? "لا نقطة بلا أثر — أرفق صورة الإنجاز، أو اكتب أثرًا غير مصوَّر."
                  : "No point without a trace — attach a completion photo, or write a non-photographed attestation."}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[100px_1fr]">
                <label className="text-[11px] text-[#5A6B85]">
                  {ar ? "العدد المنجز" : "Quantity"}
                  <input
                    type="number"
                    min={1}
                    max={Math.max(1, targetN - doneN)}
                    value={logAmount}
                    onChange={(e) => setLogAmount(Number(e.target.value) || 1)}
                    className="mt-1 h-9 w-full rounded-lg border border-[#E2E8F0] px-2 text-sm"
                  />
                </label>
                <label className="text-[11px] text-[#5A6B85]">
                  {ar ? "إثبات / ملف" : "Proof file"}
                  <input type="file" className="mt-1 block w-full text-xs" onChange={(e) => setProofFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <textarea
                rows={2}
                value={attest}
                onChange={(e) => setAttest(e.target.value)}
                placeholder={ar ? "أثر غير مصوَّر: من يشهد، وماذا أُنجز بالضبط…" : "Non-photographed evidence: who attests, and exactly what was done…"}
                className="mt-2 w-full rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[13px]"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy || !canLog}
                  onClick={() => onLog?.({ amount: logAmount, proofFile, attestation: attest.trim() })}
                  className="rounded-lg bg-[#1E9E63] px-4 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#5A6B85]"
                >
                  {ar ? "سجّل الإنجاز" : "Log completion"}
                </button>
                <span className="font-mono text-[11px] text-[#5A6B85]" dir="ltr">{doneN}/{targetN}</span>
              </div>
              {!canLog && logBlockReason && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#B91C1C]">{logBlockReason}</p>
              )}
            </section>
          )}

          {awaiting && !approved && (
            <section className="rounded-[14px] border border-[#FDE68A] bg-[#FFFBEB] p-4">
              <div className="text-[12px] font-semibold text-[#B45309]">{ar ? "بانتظار اعتمادك" : "Awaiting your approval"}</div>
              <p className="mt-1 text-[12px] leading-relaxed text-[#92400E]">
                {ar
                  ? `اكتمل العدد ${targetN}/${targetN} وأُرفق الإثبات. اعتمادك يمنح ${points} نقطة ويُقفل أمر العمل.`
                  : `${targetN}/${targetN} logged with proof attached. Approving grants ${points} points and closes the work order.`}
              </p>
              {canManage ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onApprove?.()}
                    className="rounded-lg bg-[#1E9E63] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50"
                  >
                    {ar ? "اعتمد الإنجاز" : "Approve completion"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setRejectOpen(true)}
                    className="rounded-lg border border-[#FECACA] bg-white px-4 py-2 text-[12px] text-[#B91C1C]"
                  >
                    {ar ? "أعِده لطلب إثبات" : "Return for more proof"}
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-[#B45309]">
                  {ar ? "بانتظار اعتماد المشرف — لا تُمنح النقاط قبل الاعتماد." : "Waiting for supervisor approval — points are not granted before approval."}
                </p>
              )}
              {rejectOpen && (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={ar ? "سبب الإرجاع (مطلوب)" : "Return reason (required)"}
                    className="w-full rounded-[10px] border border-[#FECACA] px-3 py-2 text-[13px]"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setRejectOpen(false)} className="rounded-lg border px-3 py-1.5 text-[11px]">
                      {ar ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      disabled={busy || !rejectReason.trim()}
                      onClick={() => onReject?.(rejectReason.trim())}
                      className="rounded-lg bg-[#14284B] px-3 py-1.5 text-[11px] text-white disabled:opacity-50"
                    >
                      {ar ? "تأكيد الإرجاع" : "Confirm return"}
                    </button>
                  </div>
                  {!rejectReason.trim() && (
                    <p className="text-[11px] text-[#B91C1C]">{ar ? "سبب الإرجاع مطلوب — لا رفض صامت." : "A return reason is required — no silent rejection."}</p>
                  )}
                </div>
              )}
            </section>
          )}

          {approved && (
            <div className="rounded-[14px] border border-[#BBF7D0] bg-[#ECFDF3] px-4 py-3 text-[12px] text-[#15803D]">
              {ar
                ? `اعتُمد الإنجاز ومُنحت ${task.pointsAwarded ?? points} نقطة — دخلت في نسبة الأداء وسجل التدقيق.`
                : `Completion approved and ${task.pointsAwarded ?? points} points granted — in the performance score and audit trail.`}
            </div>
          )}

          {task.rejectReason && !approved && (
            <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12px] text-[#B91C1C]">
              {ar ? "سبب الإرجاع السابق:" : "Previous return reason:"} {task.rejectReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
