import React from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import SwipeToDeleteItem from "@/components/notifications/SwipeToDeleteItem";
import {
  cleanNotificationText,
  kindForNotification,
  notificationTone,
  relativeNotificationTime,
} from "@/lib/notificationKind";
import { MUTED, NAVY, NAVY_FILL, SURFACE, CARD } from "@/lib/platformStyles";

export default function NotificationPanel({
  items = [],
  unread = 0,
  lang,
  t,
  onOpen,
  onDismiss,
  onMarkAll,
}) {
  const ar = lang === "ar";

  return (
    <div
      style={{
        width: 360,
        maxWidth: "92vw",
        background: CARD,
        border: "1px solid #E2E8F0",
        borderRadius: 16,
        boxShadow: "0 16px 40px rgba(20,40,75,.12)",
        overflow: "hidden",
      }}
    >
      <div aria-hidden style={{ height: 3, background: NAVY_FILL }} />
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px 11px",
          background: SURFACE,
          borderBottom: "1px solid #E2E8F0",
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: 10, letterSpacing: "0.16em", fontWeight: 600, color: MUTED }}>NIROVERA</p>
          <p style={{ margin: "3px 0 0", fontSize: 15, fontWeight: 600, color: NAVY }}>{t("notifications")}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {unread > 0 && (
            <span
              style={{
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 20,
                background: NAVY_FILL,
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          {unread > 0 && (
            <button
              type="button"
              onClick={onMarkAll}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                height: 28,
                padding: "0 9px",
                borderRadius: 8,
                border: "1px solid #E2E8F0",
                background: CARD,
                color: "#1E9E63",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <CheckCheck style={{ width: 13, height: 13 }} />
              {t("markRead")}
            </button>
          )}
        </div>
      </header>

      <div style={{ maxHeight: 380, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center" }}>
            <span
              style={{
                width: 44,
                height: 44,
                margin: "0 auto 12px",
                borderRadius: 12,
                background: SURFACE,
                color: MUTED,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Bell style={{ width: 18, height: 18 }} strokeWidth={1.75} />
            </span>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{t("noNotifications")}</p>
            <p style={{ margin: "6px 0 0", fontSize: 12, lineHeight: 1.6, color: MUTED }}>
              {ar ? "عندما يحدث أمر يستحق المتابعة سيظهر هنا." : "When something needs attention, it will appear here."}
            </p>
          </div>
        ) : (
          items.slice(0, 12).map((item) => {
            const kind = kindForNotification(item.text);
            const tone = notificationTone(kind);
            const Icon = kind.icon;
            const title = cleanNotificationText(item.text) || (ar ? kind.ar : kind.en);
            return (
              <SwipeToDeleteItem key={item.id} onDelete={() => onDismiss(item.id)}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "12px 12px 12px 10px",
                    borderBottom: "1px solid #F1F5F9",
                    background: item.read ? CARD : SURFACE,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onOpen(item)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      textAlign: "start",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: tone.bg,
                        color: tone.fg,
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon style={{ width: 16, height: 16 }} strokeWidth={1.85} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {!item.read && (
                          <span
                            aria-hidden
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: "#1E9E63",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: item.read ? 500 : 600,
                            color: NAVY,
                            lineHeight: 1.45,
                          }}
                        >
                          {title}
                        </span>
                      </span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 11, color: MUTED }}>
                        {relativeNotificationTime(item.createdAt, lang)}
                        <span style={{ marginInline: 6, color: "#CBD5E1" }}>·</span>
                        {ar ? kind.ar : kind.en}
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismiss(item.id)}
                    aria-label={ar ? "إخفاء" : "Dismiss"}
                    style={{
                      width: 26,
                      height: 26,
                      border: "none",
                      borderRadius: 8,
                      background: "transparent",
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
                </div>
              </SwipeToDeleteItem>
            );
          })
        )}
      </div>
    </div>
  );
}
