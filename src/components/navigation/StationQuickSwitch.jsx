import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import useStationSwitcher from "@/hooks/useStationSwitcher";
import { READINESS_COLOR, readinessLabel } from "@/lib/stationReadiness";
import { CARD, INK, MUTED, SURFACE } from "@/lib/platformStyles";

/** Arabic search must ignore diacritics and alef/ya/ta-marbuta spelling. */
function fold(value) {
  return String(value || "")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
}

const overlay = {
  position: "fixed",
  inset: 0,
  zIndex: 90,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "10vh 16px 16px",
  background: "rgba(20,40,75,.38)",
};

const card = {
  width: "100%",
  maxWidth: "380px",
  background: CARD,
  border: "1px solid #E2E8F0",
  borderRadius: "12px",
  boxShadow: "0 16px 40px rgba(20,40,75,.2)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  maxHeight: "min(420px, 64vh)",
};

const groupLabel = {
  padding: "10px 16px 4px",
  fontSize: "9px",
  letterSpacing: "0.12em",
  color: MUTED,
  fontWeight: 600,
};

const kbd = {
  display: "inline-block",
  padding: "1px 5px",
  borderRadius: "5px",
  border: "1px solid #E2E8F0",
  background: SURFACE,
  fontSize: "10px",
  color: MUTED,
  fontFamily: "'IBM Plex Mono',monospace",
};

/**
 * Station quick-switch palette — changes the header scope in place.
 * It never navigates: the section stays mounted and re-derives on the new
 * station, so tabs, filters and scroll survive the switch.
 */
export default function StationQuickSwitch({ open, onClose }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { stations, scope, readiness, recents, apply } = useStationSwitcher();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  const rows = useMemo(() => {
    const text = fold(query);
    const stationRow = (station, group) => ({
      id: String(station.id),
      group,
      name: station.name,
      code: station.code || station.shortCode || "",
      readiness: readiness.get(String(station.id)) || null,
    });
    const match = (station) =>
      !text
      || fold(station.name).includes(text)
      || fold(station.code || station.shortCode).includes(text);

    const all = [];
    if (!text || fold(ar ? "كل الفروع" : "All stations").includes(text)) {
      all.push({
        id: "all",
        group: "scope",
        name: ar ? "كل الفروع" : "All stations",
        code: "",
        readiness: null,
      });
    }
    const recentRows = recents.filter(match).map((s) => stationRow(s, "recent"));
    const recentIds = new Set(recentRows.map((r) => r.id));
    const stationRows = stations
      .filter(match)
      .filter((s) => !recentIds.has(String(s.id)))
      .map((s) => stationRow(s, "station"));
    return [...all, ...recentRows, ...stationRows];
  }, [query, stations, recents, readiness, ar]);

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, rows.length - 1)));
  }, [rows.length]);

  if (!open) return null;

  const choose = (row) => {
    apply(row.id);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => (rows.length ? (c + 1) % rows.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => (rows.length ? (c - 1 + rows.length) % rows.length : 0));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const row = rows[cursor];
      if (row) choose(row);
      return;
    }
    if (/^[1-9]$/.test(event.key) && (event.altKey || event.metaKey)) {
      event.preventDefault();
      const row = rows[Number(event.key) - 1];
      if (row) choose(row);
    }
  };

  let lastGroup = null;

  return (
    <div
      style={overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div style={card} dir={ar ? "rtl" : "ltr"} role="dialog" aria-modal="true">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", borderBottom: "1px solid #E2E8F0" }}>
          <span style={{ color: MUTED, fontSize: "12px" }}>⌕</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={ar ? "انتقل إلى فرع — بالاسم أو الرمز" : "Jump to a station — by name or code"}
            aria-label={ar ? "تبديل الفرع" : "Switch station"}
            style={{
              flex: 1,
              height: "40px",
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "13px",
              color: INK,
              fontFamily: "inherit",
            }}
          />
          <span style={kbd}>Esc</span>
        </div>

        <div style={{ overflowY: "auto", padding: "6px" }}>
          {rows.length === 0 && (
            <div style={{ padding: "28px 16px", textAlign: "center", fontSize: "12px", color: MUTED }}>
              {ar ? "لا فرع تطابق البحث ضمن صلاحيتك." : "No station in your permission scope matches this search."}
            </div>
          )}
          {rows.map((row, index) => {
            const active = index === cursor;
            const selected = String(scope) === row.id;
            const header = row.group !== lastGroup && row.group !== "scope"
              ? (row.group === "recent" ? (ar ? "الأحدث" : "Recent") : (ar ? "الفروع" : "Stations"))
              : null;
            lastGroup = row.group;
            const level = row.readiness?.level;
            const blocker = row.readiness?.blockers?.[0];
            return (
              <React.Fragment key={`${row.group}-${row.id}`}>
                {header && <div style={groupLabel}>{header}</div>}
                <button
                  type="button"
                  ref={active ? (el) => el?.scrollIntoView({ block: "nearest" }) : null}
                  onMouseEnter={() => setCursor(index)}
                  onClick={() => choose(row)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textAlign: "start",
                    background: active ? SURFACE : "transparent",
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: level ? READINESS_COLOR[level] : "#CBD5E1",
                    }}
                  />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      <span style={{ fontSize: "13px", fontWeight: selected ? 600 : 500, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.name}
                      </span>
                      {row.code && (
                        <span dir="ltr" style={{ fontSize: "10px", color: MUTED, fontFamily: "'IBM Plex Mono',monospace" }}>
                          {row.code}
                        </span>
                      )}
                      {selected && (
                        <span style={{ fontSize: "10px", color: "#1E9E63", fontWeight: 600 }}>
                          {ar ? "النطاق الحالي" : "current scope"}
                        </span>
                      )}
                    </span>
                    <span style={{ display: "block", marginTop: "3px", fontSize: "11px", color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {row.id === "all"
                        ? (ar ? `النطاق الكامل · ${stations.length} فروع` : `Full scope · ${stations.length} stations`)
                        : blocker
                          ? (ar ? blocker.ar : blocker.en)
                          : (ar ? "لا بوابة مفتوحة على هذا الفرع" : "No open gate on this station")}
                    </span>
                  </span>
                  {row.readiness && (
                    <span style={{ textAlign: "end", flexShrink: 0 }}>
                      <span dir="ltr" style={{ display: "block", fontSize: "13px", fontWeight: 600, color: READINESS_COLOR[level], fontFamily: "'IBM Plex Sans',sans-serif" }}>
                        {row.readiness.score}%
                      </span>
                      <span style={{ display: "block", fontSize: "10px", color: MUTED }}>
                        {readinessLabel(level, ar)}
                      </span>
                    </span>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", padding: "7px 12px", borderTop: "1px solid #E2E8F0", background: SURFACE, fontSize: "10px", color: MUTED }}>
          <span><span style={kbd}>↑↓</span> {ar ? "تنقل" : "move"}</span>
          <span><span style={kbd}>↵</span> {ar ? "بدّل النطاق" : "switch scope"}</span>
          <span><span style={kbd}>Alt+1…9</span> {ar ? "اختيار سريع" : "quick pick"}</span>
          <span style={{ marginInlineStart: "auto" }}>
            {ar ? "التبديل يبقيك في نفس القسم — لا إعادة تحميل" : "Switching keeps you in the same section — no reload"}
          </span>
        </div>
      </div>
    </div>
  );
}
