
import React from "react";
import { FileText, Download, Paperclip } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";
import { ACCENT, CARD, MUTED, NAVY, SURFACE } from "@/lib/chatUiStyles";

const isImage = (name = "", type = "") =>
  /^image\/(png|jpe?g|gif|webp|svg)$/i.test(type) || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
const isAudio = (name = "", type = "") => /^audio\//i.test(type) || /\.(webm|mp3|wav|m4a|ogg)$/i.test(name);

export default function ChatMediaGallery({ messages, t, lang }) {
  const items = (messages || []).flatMap((m) =>
    (m.files || []).map((f) => ({ ...f, userName: m.user_name, createdAt: m.created_at }))
  );

  if (items.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ textAlign: "center", color: MUTED }}>
          <Paperclip style={{ width: 22, height: 22, margin: "0 auto 10px", opacity: 0.45 }} />
          <p style={{ margin: 0, fontSize: 13 }}>{t("noMediaShared")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 12 }}>
        {items.map((f, i) => (
          <a
            key={i}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            download={f.name}
            style={{
              display: "block",
              padding: 10,
              borderRadius: 12,
              border: "1px solid #E2E8F0",
              background: CARD,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            {isImage(f.name, f.type) ? (
              <img
                src={f.url}
                alt={f.name}
                style={{ width: "100%", height: 96, borderRadius: 9, objectFit: "cover", display: "block", background: SURFACE }}
              />
            ) : isAudio(f.name, f.type) ? (
              <audio src={f.url} controls style={{ width: "100%", height: 36 }} onClick={(e) => e.stopPropagation()} />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 96,
                  borderRadius: 9,
                  background: SURFACE,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: ACCENT,
                }}
              >
                <FileText style={{ width: 22, height: 22 }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 8 }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {f.name}
              </p>
              <Download style={{ width: 14, height: 14, color: MUTED, flexShrink: 0 }} />
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {t("sharedBy")} {f.userName} · {formatDateTime(f.createdAt, lang)}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
