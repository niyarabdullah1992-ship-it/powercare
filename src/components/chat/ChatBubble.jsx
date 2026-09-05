import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Copy, Trash2 } from "lucide-react";
import { CommentAttachments } from "@/components/tasks/CommentFiles";
import { BORDER, CARD, DANGER, MUTED, NAVY, NAVY_FILL } from "@/lib/platformStyles";

const DELETE_WINDOW_MS = 2 * 60 * 1000;
const INTERACTIVE = "a, button, audio, input, textarea";

/** WhatsApp-style bubbles — long-press / right-click / chevron, then copy or delete. */
export default function ChatBubble({ msg, isMine, lang, onDelete }) {
  const ar = lang === "ar";
  const time = new Date(msg.created_at).toLocaleTimeString(lang, { hour: "2-digit", minute: "2-digit" });
  const [now, setNow] = useState(Date.now());
  const [picked, setPicked] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [hover, setHover] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const hold = useRef({ timer: 0, x: 0, y: 0, armed: false });
  const ignoreClick = useRef(false);
  const deletable = isMine && onDelete && now - new Date(msg.created_at).getTime() <= DELETE_WINDOW_MS;

  useEffect(() => {
    if (!deletable) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, [deletable]);

  const clearHold = () => {
    if (hold.current.timer) {
      window.clearTimeout(hold.current.timer);
      hold.current.timer = 0;
    }
    hold.current.armed = false;
  };

  const openMenu = () => {
    ignoreClick.current = true;
    setPicked(true);
    setConfirming(false);
    try {
      navigator.vibrate?.(12);
    } catch {
      /* ignore */
    }
  };

  const closeMenu = () => {
    setPicked(false);
    setConfirming(false);
  };

  useLayoutEffect(() => {
    if (!picked || !rootRef.current) {
      setMenuStyle(null);
      return undefined;
    }
    const place = () => {
      const rect = rootRef.current.getBoundingClientRect();
      const openUp = window.innerHeight - rect.bottom < 180;
      setMenuStyle({
        position: "fixed",
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        ...(ar
          ? { left: Math.max(12, rect.left + 8) }
          : { right: Math.max(12, window.innerWidth - rect.right + 8) }),
        zIndex: 80,
        minWidth: 168,
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.12)",
        overflow: "hidden",
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [picked, confirming, ar]);

  const copyText = async () => {
    if (!msg.text) return;
    try {
      await navigator.clipboard.writeText(msg.text);
    } catch {
      /* ignore */
    }
    closeMenu();
  };

  const menuItem = (label, onClick, danger, Icon) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        border: "none",
        background: "transparent",
        color: danger ? DANGER : NAVY,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "start",
      }}
    >
      <Icon size={15} strokeWidth={2} />
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMine ? "flex-end" : "flex-start",
      }}
    >
      <div
        ref={rootRef}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHover(true);
        }}
        onPointerLeave={() => setHover(false)}
        onPointerDown={(event) => {
          if (event.pointerType === "mouse" && event.button !== 0) return;
          if (event.target.closest(INTERACTIVE)) return;
          hold.current.x = event.clientX;
          hold.current.y = event.clientY;
          hold.current.armed = true;
          hold.current.timer = window.setTimeout(openMenu, 450);
        }}
        onPointerMove={(event) => {
          if (!hold.current.armed) return;
          const dx = event.clientX - hold.current.x;
          const dy = event.clientY - hold.current.y;
          if ((dx * dx) + (dy * dy) > 64) clearHold();
        }}
        onPointerUp={clearHold}
        onPointerCancel={clearHold}
        onContextMenu={(event) => {
          if (event.target.closest(INTERACTIVE)) return;
          event.preventDefault();
          openMenu();
        }}
        onClick={(event) => {
          if (!ignoreClick.current) return;
          ignoreClick.current = false;
          event.preventDefault();
          event.stopPropagation();
        }}
        style={{
          position: "relative",
          maxWidth: "74%",
          background: isMine ? NAVY_FILL : CARD,
          color: isMine ? "#fff" : NAVY,
          border: isMine ? "none" : `1px solid ${BORDER}`,
          borderRadius: isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
          padding: "11px 14px",
          boxShadow: isMine ? "0 1px 0 rgba(20,40,75,.12)" : "0 1px 0 #E2E8F0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: isMine ? "#6EE7B7" : NAVY, flex: 1 }}>
            {isMine ? (ar ? "أنت" : "You") : msg.user_name}
          </div>
          <button
            type="button"
            aria-label={ar ? "خيارات الرسالة" : "Message options"}
            onClick={(event) => {
              event.stopPropagation();
              if (picked) closeMenu();
              else openMenu();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 20,
              height: 20,
              border: "none",
              borderRadius: 999,
              background: hover || picked ? (isMine ? "rgba(255,255,255,.12)" : CARD) : "transparent",
              color: isMine ? "#A8B4C8" : MUTED,
              cursor: "pointer",
              opacity: hover || picked ? 1 : 0,
            }}
          >
            <ChevronDown size={14} />
          </button>
        </div>
        {msg.text ? (
          <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {msg.text}
          </div>
        ) : null}
        <CommentAttachments files={msg.files} />
        <div style={{ fontSize: 10, color: isMine ? "#A8B4C8" : MUTED, marginTop: 6 }}>{time}</div>
      </div>

      {picked && typeof document !== "undefined"
        ? createPortal(
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 70 }}
              onClick={closeMenu}
              onContextMenu={(event) => {
                event.preventDefault();
                closeMenu();
              }}
            />
            {menuStyle ? (
              <div style={menuStyle} onClick={(event) => event.stopPropagation()}>
                {confirming ? (
                  <div style={{ padding: "12px 14px", display: "grid", gap: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>
                      {ar ? "حذف هذه الرسالة؟" : "Delete this message?"}
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button type="button" onClick={() => setConfirming(false)} style={{ ...quietBtn }}>
                        {ar ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete?.(msg);
                          closeMenu();
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 9,
                          border: "none",
                          background: DANGER,
                          color: "#fff",
                          fontSize: 12,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {ar ? "حذف" : "Delete"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {msg.text ? menuItem(ar ? "نسخ" : "Copy", copyText, false, Copy) : null}
                    {deletable ? menuItem(ar ? "حذف" : "Delete", () => setConfirming(true), true, Trash2) : null}
                    {!msg.text && !deletable ? (
                      <div style={{ padding: "10px 14px", fontSize: 12, color: MUTED }}>
                        {ar ? "لا خيارات لهذه الرسالة." : "No actions for this message."}
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </>,
          document.body,
        )
        : null}
    </div>
  );
}

const quietBtn = {
  padding: "6px 12px",
  borderRadius: 9,
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: MUTED,
  fontSize: 12,
  cursor: "pointer",
  fontFamily: "inherit",
};
