import React from "react";

/** Navy-tinted orthogonal lines — org chart, not UI chrome. */
export const ORG_LINE = "color-mix(in oklab, #14284B 28%, #D7DDE6)";
export const ORG_DOT = "color-mix(in oklab, #14284B 42%, #E8EDF3)";
export const ORG_COL_PAD = 16;
export const ORG_STEM_H = 26;
export const ORG_CAP_H = 22;
export const ORG_LINE_W = 2;

export function OrgStem({ height = ORG_STEM_H }) {
  return (
    <span
      aria-hidden
      style={{
        width: ORG_LINE_W,
        height,
        marginBottom: -1,
        background: ORG_LINE,
        borderRadius: 99,
        flex: "none",
      }}
    />
  );
}

export function OrgCap({ index, total }) {
  if (total <= 1) return <OrgStem height={ORG_CAP_H} />;
  const first = index === 0;
  const last = index === total - 1;
  return (
    <div style={{ width: "100%", height: ORG_CAP_H, position: "relative", flex: "none", overflow: "visible" }}>
      <span
        style={{
          position: "absolute",
          top: 0,
          height: ORG_LINE_W,
          insetInlineStart: first ? "50%" : -ORG_COL_PAD,
          insetInlineEnd: last ? "50%" : -ORG_COL_PAD,
          background: ORG_LINE,
          borderRadius: 99,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          insetInlineStart: "50%",
          width: ORG_LINE_W,
          height: ORG_CAP_H,
          marginInlineStart: -ORG_LINE_W / 2,
          background: ORG_LINE,
          borderRadius: 99,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: -2,
          insetInlineStart: "50%",
          width: 6,
          height: 6,
          marginInlineStart: -3,
          borderRadius: 99,
          background: ORG_DOT,
          boxShadow: "0 0 0 2px hsl(220 20% 98%)",
        }}
      />
    </div>
  );
}

export function OrgColumn({ children, pad = true }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: "max-content",
        flex: "none",
        paddingInline: pad ? ORG_COL_PAD : 0,
      }}
    >
      {children}
    </div>
  );
}

export function OrgRow({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      {children}
    </div>
  );
}

export function OrgKids({ children }) {
  const list = React.Children.toArray(children).filter(Boolean);
  if (!list.length) return null;
  return (
    <>
      <OrgStem />
      <OrgRow>{list}</OrgRow>
    </>
  );
}

export function OrgStaffTray({ children, cols, itemW, itemH, gap = 8, label }) {
  const items = React.Children.toArray(children).filter(Boolean);
  if (!items.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "max-content" }}>
      <OrgStem height={18} />
      <div
        style={{
          background: "hsl(222 28% 97%)",
          border: "1px solid hsl(220 16% 90%)",
          borderRadius: 14,
          padding: "8px 10px 10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        {label ? (
          <span style={{ fontSize: 10, fontWeight: 700, color: "hsl(220 9% 46%)", letterSpacing: ".01em" }}>
            {label}
          </span>
        ) : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, ${itemW}px)`,
            gridAutoRows: `${itemH}px`,
            gap,
            justifyContent: "center",
          }}
        >
          {items}
        </div>
      </div>
    </div>
  );
}
