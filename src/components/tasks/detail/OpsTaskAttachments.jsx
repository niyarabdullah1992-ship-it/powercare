import React, { useState } from "react";
import OpsTaskSection from "@/components/tasks/detail/OpsTaskSection";
import { BORDER, BRAND, CARD, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";

const chip = { display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: SURFACE, textDecoration: "none" };
const kind = (bg, fg, bd) => ({ display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600, background: bg, color: fg, border: `1px solid ${bd}`, flexShrink: 0 });

/** Task attachments — files, voice notes, and an add-file action. */
export default function OpsTaskAttachments({ taskId, attachments, ar, busy, onAddAttachment }) {
  const [file, setFile] = useState(null);
  return (
    <OpsTaskSection title={ar ? "المرفقات" : "Attachments"} count={attachments.length}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        {attachments.map((f, i) => {
          const isAudio = /\.(webm|m4a|ogg|mp3|wav)$/i.test(f.name || "") || String(f.type || "").startsWith("audio/");
          if (isAudio && f.url) {
            return (
              <span key={`${taskId}-att-${i}`} style={chip}>
                <span style={kind("#EAF6EF", "#14683F", "#BBF7D0")}>{ar ? "صوت" : "AUDIO"}</span>
                <audio src={f.url} controls style={{ height: 28, maxWidth: 200 }} />
              </span>
            );
          }
          return (
            <a key={`${taskId}-att-${i}`} href={f.url} target="_blank" rel="noreferrer" style={{ ...chip, cursor: "pointer" }}>
              <span style={kind("#FEF2F2", "#DC2626", "#FECACA")}>{(f.name || "").toLowerCase().endsWith(".pdf") ? "PDF" : "FILE"}</span>
              <span style={{ fontSize: 12, color: NAVY }}>{f.name || "file"}</span>
            </a>
          );
        })}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 10, border: "1px dashed #CBD5E1", background: CARD, fontSize: 12, color: MUTED, cursor: "pointer" }}>
          <span>{ar ? "أرفق ملفًا" : "Attach file"}</span>
          <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {file && (
          <button type="button" disabled={busy} onClick={async () => { await onAddAttachment?.(file); setFile(null); }} style={{ padding: "8px 13px", borderRadius: 9, background: BRAND, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.5 : 1 }}>
            {ar ? `رفع ${file.name}` : `Upload ${file.name}`}
          </button>
        )}
      </div>
      {attachments.length === 0 && !file && (
        <div style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>{ar ? "لا مرفقات بعد." : "No attachments yet."}</div>
      )}
    </OpsTaskSection>
  );
}