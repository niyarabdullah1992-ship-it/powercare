import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";
import { ACCENT, MUTED, NAVY, NAVY_FILL } from "@/lib/platformStyles";

const DELETE_WINDOW_MS = 2 * 60 * 1000;

/** Platform.dc.html chat bubbles — navy / surface, green author accent. */
export default function ChatBubble({ msg, isMine, lang, onDelete }) {
  const time = new Date(msg.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  const [now, setNow] = useState(Date.now());
  const deletable = isMine && onDelete && now - new Date(msg.created_at).getTime() <= DELETE_WINDOW_MS;

  useEffect(() => {
    if (!deletable) return;
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [deletable]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {deletable && (
        <button
          type="button"
          onClick={() => onDelete(msg)}
          aria-label="delete"
          style={{
            border: "1px solid #E2E8F0",
            background: "#fff",
            color: MUTED,
            cursor: "pointer",
            padding: 6,
            borderRadius: 8,
            fontFamily: "inherit",
            display: "inline-flex",
          }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      )}
      <div
        style={isMine
          ? {
              maxWidth: "74%",
              background: NAVY_FILL,
              color: "#fff",
              borderRadius: "14px 14px 4px 14px",
              padding: "11px 14px",
              boxShadow: "0 1px 0 rgba(20,40,75,.12)",
            }
          : {
              maxWidth: "74%",
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: "14px 14px 14px 4px",
              padding: "11px 14px",
              boxShadow: "0 1px 0 #E2E8F0",
            }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isMine ? "#6EE7B7" : ACCENT,
            marginBottom: 5,
          }}
        >
          {isMine ? (lang === "ar" ? "أنت" : "You") : msg.user_name}
        </div>
        {msg.text && (
          <div
            style={{
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              color: isMine ? "#fff" : NAVY,
            }}
          >
            {msg.text}
          </div>
        )}
        <CommentAttachments files={msg.files} />
        <div style={{ fontSize: 10, color: isMine ? "#A8B4C8" : MUTED, marginTop: 6 }}>{time}</div>
      </div>
    </div>
  );
}
