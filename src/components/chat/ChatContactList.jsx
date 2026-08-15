
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";
import { PRESENCE_OPTIONS } from "@/components/employees/PresenceStatusPicker";
import { isOnLeaveToday } from "@/lib/leaveTypes";
import { getOnlineEmployeeIds } from "@/lib/store";
import { ACCENT, MUTED, NAVY, SURFACE, channelBtn, iconTile } from "@/lib/chatUiStyles";

const RANK = { online: 0, busy: 1, call: 2, away: 3, leave: 4, offline: 5 };

const DOT = {
  online: "#10B981",
  busy: "#EF4444",
  call: "#8B5CF6",
  away: "#F59E0B",
  leave: "#0EA5E9",
  offline: "#94A3B8",
};

function resolvePresence(emp, onlineSet) {
  if (isOnLeaveToday(emp)) {
    return { key: "leave", labelKey: "onLeaveStatus", rank: RANK.leave };
  }
  const manual = PRESENCE_OPTIONS.find((o) => o.key === emp.presenceStatus);
  if (manual) {
    return { key: manual.key, labelKey: manual.labelKey, rank: RANK[manual.key] ?? RANK.offline };
  }
  if (onlineSet.has(emp.id)) {
    return { key: "online", labelKey: "presenceOnline", rank: RANK.online };
  }
  return { key: "offline", labelKey: null, rank: RANK.offline };
}

export default function ChatContactList({
  contacts,
  activeChat,
  onSelectGeneral,
  onSelectContact,
  t,
  companyId,
  lang = "ar",
}) {
  const listRef = useRef(null);
  const [onlineIds, setOnlineIds] = useState([]);
  const [canScrollMore, setCanScrollMore] = useState(false);
  const ar = lang === "ar";

  useEffect(() => {
    if (!companyId) return;
    let active = true;
    const load = () => {
      getOnlineEmployeeIds(companyId)
        .then((ids) => { if (active) setOnlineIds(Array.isArray(ids) ? ids : []); })
        .catch(() => { if (active) setOnlineIds([]); });
    };
    load();
    const timer = window.setInterval(load, 12000);
    return () => { active = false; window.clearInterval(timer); };
  }, [companyId]);

  const onlineSet = useMemo(() => new Set(onlineIds), [onlineIds]);

  const sorted = useMemo(() => {
    return [...(contacts || [])]
      .map((c) => ({ contact: c, presence: resolvePresence(c, onlineSet) }))
      .sort((a, b) => {
        if (a.presence.rank !== b.presence.rank) return a.presence.rank - b.presence.rank;
        return String(a.contact.name || "").localeCompare(String(b.contact.name || ""), ar ? "ar" : "en");
      });
  }, [contacts, onlineSet, ar]);

  const updateScrollHint = () => {
    const el = listRef.current;
    if (!el) {
      setCanScrollMore(false);
      return;
    }
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    setCanScrollMore(remaining > 12);
  };

  useEffect(() => {
    updateScrollHint();
    const el = listRef.current;
    if (!el) return undefined;
    const onScroll = () => updateScrollHint();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateScrollHint) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro?.disconnect();
    };
  }, [sorted.length, activeChat]);

  const statusLabel = (presence) => {
    if (!presence.labelKey) return ar ? "غير متصل" : "Offline";
    return t(presence.labelKey);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1, height: "100%" }}>
      <button
        type="button"
        onClick={onSelectGeneral}
        style={{
          ...channelBtn(activeChat?.type === "general"),
          borderRadius: 0,
          borderBottom: "1px solid #F1F5F9",
          padding: "12px 14px",
          flexShrink: 0,
        }}
      >
        <span style={iconTile}>
          <Users style={{ width: 16, height: 16 }} strokeWidth={1.75} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY }}>
            {t("generalChat")}
          </span>
          <span style={{ display: "block", marginTop: 2, fontSize: 11, color: MUTED }}>
            {ar ? "قناة التشغيل · ثابتة أعلى القائمة" : "Ops channel · pinned at top"}
          </span>
        </span>
      </button>

      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          overscrollBehavior: "contain",
          scrollbarGutter: "stable",
        }}
      >
        {sorted.map(({ contact: c, presence }) => {
          const active = activeChat?.type === "dm" && activeChat.userId === c.id;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectContact(c)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectContact(c);
              }}
              style={{
                ...channelBtn(active),
                borderRadius: 0,
                borderBottom: "1px solid #F1F5F9",
                padding: "12px 14px",
              }}
            >
              <span style={{ position: "relative", flexShrink: 0 }}>
                <span
                  style={{
                    ...iconTile,
                    background: active ? "#ECFDF3" : SURFACE,
                    color: active ? ACCENT : NAVY,
                    border: "1px solid #E2E8F0",
                    overflow: "hidden",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {c.profile?.avatarUrl
                    ? <img src={c.profile.avatarUrl} alt={c.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : c.name.charAt(0)}
                </span>
                <span
                  style={{
                    position: "absolute",
                    bottom: 0,
                    insetInlineEnd: 0,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: DOT[presence.key] || DOT.offline,
                    border: "2px solid #fff",
                    boxSizing: "content-box",
                  }}
                  title={statusLabel(presence)}
                />
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  <EmployeeNameLink employeeId={c.id} employeeName={c.name} onClick={(event) => event.stopPropagation()} />
                </span>
                <span style={{ display: "block", marginTop: 2, fontSize: 11, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {statusLabel(presence)}
                  {c.role ? ` · ${t(c.role)}` : ""}
                </span>
              </span>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p style={{ margin: 0, padding: "28px 16px", textAlign: "center", fontSize: 12, color: MUTED }}>
            {t("noResults")}
          </p>
        )}
      </div>

      {canScrollMore && (
        <button
          type="button"
          onClick={() => {
            const el = listRef.current;
            if (!el) return;
            el.scrollBy({ top: 96, behavior: "smooth" });
          }}
          style={{
            flexShrink: 0,
            border: "none",
            borderTop: "1px solid #E2E8F0",
            background: "linear-gradient(180deg, rgba(247,248,250,0) 0%, #F7F8FA 40%)",
            color: MUTED,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 10px",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <ChevronDown style={{ width: 16, height: 16 }} strokeWidth={2} />
          {ar ? "المزيد من الأعضاء" : "More members"}
        </button>
      )}
    </div>
  );
}
