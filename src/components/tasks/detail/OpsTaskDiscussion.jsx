import React from "react";
import OpsTaskSection from "@/components/tasks/detail/OpsTaskSection";
import { BAD, BORDER, BRAND, INK, MUTED, NAVY } from "@/lib/platformStyles";

/** Comment thread with blocker flags and deadline-extension requests. */
export default function OpsTaskDiscussion({ task, comments, ar, busy, canManage, approved, onExtendDue }) {
  return (
    <OpsTaskSection title={ar ? "المحادثة والعوائق" : "Discussion & blockers"} count={comments.length}>
      {task.rejectReason && !approved && (
        <div style={{ borderRadius: 10, border: "1px solid #FECACA", background: "#FEF2F2", padding: "10px 12px", fontSize: 12, color: "#B91C1C", marginBottom: 9 }}>
          {ar ? "سبب الرفض:" : "Rejection reason:"} {task.rejectReason}
        </div>
      )}
      {comments.length === 0 && <div style={{ fontSize: 12, color: MUTED }}>{ar ? "لا تعليقات بعد." : "No comments yet."}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {comments.map((c) => (
          <div key={c.id} style={{ borderRadius: 10, border: c.isIssue ? "1px solid #FECACA" : `1px solid ${BORDER}`, background: c.isIssue ? "#FEF2F2" : "#F7F8FA", padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{c.authorName}</span>
              {c.isIssue && <span style={BAD}>{ar ? "عائق" : "Blocker"}</span>}
              <span style={{ flex: 1 }} />
              <span dir="ltr" style={{ fontSize: 10, color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>{c.at ? String(c.at).slice(0, 16).replace("T", " ") : ""}</span>
            </div>
            <div style={{ fontSize: 13, color: INK, lineHeight: 1.65, marginTop: 5, textWrap: "pretty" }}>{c.text}</div>
            {c.requestedDueAt && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#B45309", fontWeight: 600 }}>{ar ? `طلب تمديد الموعد إلى ${c.requestedDueAt}` : `Requested extension to ${c.requestedDueAt}`}</span>
                {canManage && !approved && task.dueAt !== c.requestedDueAt && onExtendDue && (
                  <button type="button" disabled={busy} onClick={() => onExtendDue(c.requestedDueAt)} style={{ padding: "4px 10px", borderRadius: 8, border: "none", background: BRAND, color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {ar ? "اعتمد التمديد" : "Approve extension"}
                  </button>
                )}
                {task.dueAt === c.requestedDueAt && <span style={{ fontSize: 11, color: "#15803D" }}>{ar ? "اعتُمد" : "Approved"}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </OpsTaskSection>
  );
}