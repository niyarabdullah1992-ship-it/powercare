
import React, { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import { ACCENT, CARD, MUTED, SURFACE, field } from "@/lib/chatUiStyles";

/** Compact chat search — single tight toolbar. */
export default function ChatSearchPanel({ messages, currentUserId, t, lang }) {
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const ar = lang === "ar";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (messages || []).filter((m) => {
      const body = (m.text || "").toLowerCase();
      if (q && !body.includes(q) && !(m.user_name || "").toLowerCase().includes(q)) return false;
      if (date) {
        const d = new Date(m.created_at || m.createdAt);
        if (isNaN(d) || d.toISOString().slice(0, 10) !== date) return false;
      }
      return true;
    });
  }, [messages, query, date]);

  const clear = () => { setQuery(""); setDate(""); };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div
        style={{
          padding: "8px 12px",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "nowrap",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
          <Search
            style={{
              position: "absolute",
              insetInlineStart: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 13,
              height: 13,
              color: MUTED,
              pointerEvents: "none",
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "ابحث…" : "Search…"}
            dir="auto"
            autoFocus
            style={{
              ...field,
              height: 32,
              background: SURFACE,
              paddingInlineStart: 30,
              paddingInlineEnd: 10,
              fontSize: 12,
            }}
          />
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label={t("byDateFilter")}
          style={{
            ...field,
            width: 118,
            maxWidth: "32%",
            height: 32,
            background: SURFACE,
            fontSize: 11,
            flexShrink: 0,
            paddingInline: 8,
          }}
        />
        {(query || date) && (
          <button
            type="button"
            onClick={clear}
            aria-label={t("cancel")}
            title={t("cancel")}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              background: CARD,
              color: MUTED,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>
        )}
        <span style={{ fontSize: 11, color: MUTED, whiteSpace: "nowrap", flexShrink: 0, fontWeight: 600 }}>
          <span style={{ color: ACCENT }}>{results.length}</span>
        </span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
        {results.length === 0 ? (
          <p style={{ margin: "28px 0 0", textAlign: "center", fontSize: 13, color: MUTED }}>{t("noMessages")}</p>
        ) : (
          results.map((m) => (
            <ChatBubble key={m.id} msg={m} isMine={m.user_id === currentUserId} lang={lang} />
          ))
        )}
      </div>
    </div>
  );
}
