import React from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard, ClipboardCheck, CalendarClock, CalendarOff, ListTodo, ArrowUpCircle,
  Camera, PenLine, FileText, MessageSquare, UserCog, Briefcase, Trophy, Network,
  ShieldQuestion, MessageCircle, Banknote, ReceiptText, Calculator, Boxes, Warehouse,
  FolderOpen, Sparkles, Settings2, Users,
} from "lucide-react";
import Logo from "@/components/Logo";
import { BORDER, CARD, INK, MUTED, NAVY_FILL, SURFACE, pageCol } from "@/lib/platformStyles";

/**
 * Each section carries its own identity glyph in the navy seal tile — the same
 * icon language as the sidebar — so every screen is instantly recognisable while
 * staying one institution. Longest route prefix wins; an explicit `icon` overrides.
 */
const SECTION_ICONS = [
  ["/app/attendance", ClipboardCheck],
  ["/app/shifts", CalendarClock],
  ["/app/leave", CalendarOff],
  ["/app/tasks", ListTodo],
  ["/app/escalation", ArrowUpCircle],
  ["/app/work-proof", Camera],
  ["/app/signing", PenLine],
  ["/app/daily-report", FileText],
  ["/app/chat", MessageSquare],
  ["/app/hr", UserCog],
  ["/app/employees", Users],
  ["/app/hiring", Briefcase],
  ["/app/performance", Trophy],
  ["/app/org", Network],
  ["/app/safety", ShieldQuestion],
  ["/app/complaints", MessageCircle],
  ["/app/payroll", Banknote],
  ["/app/expenses", ReceiptText],
  ["/app/accounting", Calculator],
  ["/app/assets", Boxes],
  ["/app/inventory", Warehouse],
  ["/app/files", FolderOpen],
  ["/app/assistant", Sparkles],
  ["/app/settings", Settings2],
  ["/app/help", FileText],
  ["/app/manual", FileText],
  ["/app", LayoutDashboard],
];

function resolveSectionIcon(pathname) {
  const hit = SECTION_ICONS.find(([route]) => pathname === route || pathname.startsWith(`${route}/`));
  return hit ? hit[1] : null;
}

/** Shared NiroVera section chrome — title, then a full-width tab bar, then body. */
export default function PlatformStampShell({
  ar,
  title,
  hint,
  kicker,
  icon: Icon,
  sections = [],
  tool,
  onTool,
  meta,
  metaBar,
  legal,
  children,
  maxWidth = 1280,
  flushBody = false,
}) {
  const active = sections.find((section) => section.value === tool) || sections[0];
  const subtitle = (sections.length ? (active?.hint || hint) : hint) || "";
  const eyebrow = kicker || "NIROVERA";
  const location = useLocation();
  const SealIcon = Icon || resolveSectionIcon(location.pathname);

  return (
    <div style={{ ...pageCol, maxWidth, margin: "0 auto", width: "100%" }} dir={ar ? "rtl" : "ltr"}>
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          background: CARD,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(20,40,75,.06)",
        }}
      >
        {/* Institutional brand rail — a navy letterhead line signed with one accent tab. */}
        <div aria-hidden style={{ display: "flex", height: 3 }}>
          <span style={{ width: 56, background: "var(--nv-accent, #1E9E63)" }} />
          <span style={{ flex: 1, background: NAVY_FILL }} />
        </div>
        <header
          className="nv-stamp-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 18px",
            borderBottom: sections.length ? "none" : `1px solid ${BORDER}`,
            background: "linear-gradient(180deg, color-mix(in oklab, var(--nv-navy) 4%, var(--nv-card)) 0%, var(--nv-card) 100%)",
          }}
        >
          {SealIcon ? (
            <span
              aria-hidden
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: NAVY_FILL,
                color: "#fff",
                boxShadow: "0 6px 14px rgba(20,40,75,.20)",
              }}
            >
              <SealIcon style={{ width: 21, height: 21 }} strokeWidth={1.8} />
            </span>
          ) : (
            <span
              aria-hidden
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: 0,
                background: "#fff",
                border: `1px solid ${BORDER}`,
                boxShadow: "0 2px 6px rgba(20,40,75,.08)",
              }}
            >
              <Logo size={26} wordmark={false} />
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.16em", fontWeight: 700, color: "var(--nv-accent-deep, #15803D)", textTransform: "uppercase" }}>
              {eyebrow}
            </div>
            <h1 style={{ margin: "3px 0 0", fontSize: 19, fontWeight: 700, letterSpacing: "-0.01em", color: INK }}>{title}</h1>
            {subtitle ? (
              <p style={{ margin: "5px 0 0", fontSize: 12.5, lineHeight: 1.6, color: MUTED, maxWidth: 760 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {sections.length === 0 && meta ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", flexShrink: 0 }}>
              {meta}
            </div>
          ) : null}
        </header>

        {sections.length > 0 ? (
          <nav
            aria-label={title}
            className="nv-stamp-tabs nv-stamp-tabs-bar"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))`,
              gap: 4,
              background: SURFACE,
              padding: "8px 12px",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            {sections.map(({ value, label, icon: Icon, count, step }) => {
              const selected = tool === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onTool?.(value)}
                  className="nv-stamp-tab"
                  data-selected={selected ? "true" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    minHeight: 38,
                    padding: "0 10px",
                    border: selected ? "1px solid var(--nv-accent-border)" : "1px solid transparent",
                    borderRadius: 9,
                    background: selected ? "var(--nv-accent-soft)" : "transparent",
                    color: selected ? "var(--nv-accent-deep)" : MUTED,
                    boxShadow: "none",
                    fontSize: 12,
                    fontWeight: selected ? 700 : 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                    transition: "background .12s, color .12s, border-color .12s",
                  }}
                >
                  {step ? (
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 99,
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 700,
                        background: selected ? NAVY_FILL : "transparent",
                        color: selected ? "#fff" : MUTED,
                        border: selected ? "none" : `1px solid ${BORDER}`,
                      }}
                    >
                      {step}
                    </span>
                  ) : Icon ? (
                    <Icon style={{ width: 14, height: 14, color: selected ? "var(--nv-accent-deep)" : MUTED, flexShrink: 0 }} />
                  ) : null}
                  <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {label}
                  </span>
                  {count > 0 ? (
                    <span
                      style={{
                        minWidth: 16,
                        height: 16,
                        borderRadius: 20,
                        background: selected ? "var(--nv-accent)" : "var(--nv-accent-soft)",
                        color: selected ? "#fff" : "var(--nv-accent-deep)",
                        fontSize: 9,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}
                    >
                      {count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        ) : null}

        {(metaBar || (meta && sections.length > 0)) ? (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderBottom: `1px solid ${BORDER}`,
              background: CARD,
            }}
          >
            {metaBar || meta}
          </div>
        ) : null}

        <div style={{ padding: flushBody ? 0 : 16, background: SURFACE }}>{children}</div>

        {legal ? (
          <footer
            style={{
              padding: "10px 16px 12px",
              borderTop: `1px solid ${BORDER}`,
              fontSize: 11,
              lineHeight: 1.65,
              color: MUTED,
              background: CARD,
            }}
          >
            {legal}
          </footer>
        ) : null}
      </section>
    </div>
  );
}
