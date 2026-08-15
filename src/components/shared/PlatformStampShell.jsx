import React from "react";
import Logo from "@/components/Logo";
import { BORDER, CARD, INK, MUTED, NAVY, NAVY_FILL, SURFACE, pageCol } from "@/lib/platformStyles";

/** Shared NiroVera section chrome — title, then a full-width tab bar, then body. */
export default function PlatformStampShell({
  ar,
  title,
  hint,
  kicker,
  sections = [],
  tool,
  onTool,
  meta,
  metaBar,
  legal,
  children,
  maxWidth = 1280,
}) {
  const active = sections.find((section) => section.value === tool) || sections[0];
  const subtitle = hint || active?.hint || "";

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
        <div aria-hidden style={{ height: 3, background: NAVY_FILL }} />
        <header
          className="nv-stamp-head"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 18px",
            borderBottom: sections.length ? "none" : `1px solid ${BORDER}`,
            background: CARD,
          }}
        >
          <span
            aria-hidden
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: 0,
              background: "#fff",
              border: `1px solid ${BORDER}`,
            }}
          >
            <Logo size={24} wordmark={false} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            {kicker ? (
              <div style={{ fontSize: 10, letterSpacing: "0.18em", fontWeight: 600, color: MUTED }}>{kicker}</div>
            ) : null}
            <h1 style={{ margin: kicker ? "4px 0 0" : 0, fontSize: 18, fontWeight: 600, color: INK }}>{title}</h1>
            {subtitle ? (
              <p style={{ margin: "5px 0 0", fontSize: 12, lineHeight: 1.6, color: MUTED, maxWidth: 720 }}>
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
            {sections.map(({ value, label, icon: Icon, count }) => {
              const selected = tool === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => onTool?.(value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7,
                    minHeight: 38,
                    padding: "0 10px",
                    border: selected ? `1px solid ${BORDER}` : "1px solid transparent",
                    borderRadius: 9,
                    background: selected ? CARD : "transparent",
                    color: selected ? INK : MUTED,
                    boxShadow: selected ? "0 1px 2px rgba(20,40,75,.06)" : "none",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "center",
                  }}
                >
                  {Icon ? (
                    <Icon style={{ width: 14, height: 14, color: selected ? INK : MUTED, flexShrink: 0 }} />
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

        <div style={{ padding: 16, background: SURFACE }}>{children}</div>

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
