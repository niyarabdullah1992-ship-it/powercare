import React, { useState } from "react";
import { Archive, Search, ChevronDown, FolderOpen } from "lucide-react";
import moment from "moment";
import { formatDateTime } from "@/lib/dateFormat";
import IdentityCard, { identityIconWrap } from "@/components/shared/IdentityCard";
import { BORDER, MUTED, NAVY, SURFACE, field, NEUTRAL, CARD } from "@/lib/platformStyles";

export default function RecordSmartArchive({ items, lang, dir, emptyLabel }) {
  const ar = lang === "ar";
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState({});

  const filtered = (items || []).filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.title || "").toLowerCase().includes(q) || (it.text || "").toLowerCase().includes(q);
  });

  const years = new Map();
  for (const it of filtered) {
    const m = moment(it.date);
    const y = m.year();
    const mk = m.format("YYYY-MM");
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y);
    if (!months.has(mk)) months.set(mk, []);
    months.get(mk).push(it);
  }
  const yearList = Array.from(years.keys()).sort((a, b) => b - a);

  return (
    <IdentityCard
      icon={Archive}
      kicker={ar ? "سجل زمني" : "Timeline"}
      title={ar ? "الأرشيف" : "Archive"}
      subtitle={ar ? "تجميع تلقائي حسب السنة ثم الشهر." : "Grouped automatically by year, then month."}
      dir={dir}
      bodySurface
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              [dir === "rtl" ? "right" : "left"]: 12,
              width: 14,
              height: 14,
              color: MUTED,
              pointerEvents: "none",
            }}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={ar ? "بحث في الأرشيف…" : "Search archive…"}
            style={{ ...field, [dir === "rtl" ? "paddingRight" : "paddingLeft"]: 32 }}
          />
        </div>

        {yearList.length === 0 ? (
          <div style={{ padding: "28px 8px", textAlign: "center" }}>
            <Archive style={{ width: 28, height: 28, margin: "0 auto 8px", color: MUTED, opacity: 0.55 }} />
            <p style={{ margin: 0, fontSize: 13, color: MUTED }}>
              {emptyLabel || (ar ? "لا توجد سجلات مؤرشفة" : "No archived records")}
            </p>
          </div>
        ) : (
          yearList.map((year) => (
            <div key={year} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }}>{year}</h3>
                <span style={{ height: 1, flex: 1, background: BORDER }} />
                <span style={{ fontSize: 11, color: MUTED }}>
                  {Array.from(years.get(year).values()).reduce((a, arr) => a + arr.length, 0)}
                </span>
              </div>
              {Array.from(years.get(year).keys()).sort().reverse().map((mk) => {
                const recs = years.get(year).get(mk).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
                const isOpen = !!open[mk];
                return (
                  <div
                    key={mk}
                    style={{
                      borderRadius: 16,
                      border: `1px solid ${BORDER}`,
                      background: CARD,
                      overflow: "hidden",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [mk]: !o[mk] }))}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "12px 14px",
                        background: isOpen ? SURFACE : CARD,
                        border: 0,
                        cursor: "pointer",
                        textAlign: "start",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={identityIconWrap}>
                        <FolderOpen style={{ width: 16, height: 16 }} strokeWidth={1.75} />
                      </span>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {moment(`${mk}-01`).locale(lang).format("MMMM YYYY")}
                      </p>
                      <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>{recs.length}</span>
                      <ChevronDown
                        style={{
                          width: 16,
                          height: 16,
                          color: MUTED,
                          flexShrink: 0,
                          transform: isOpen ? "rotate(180deg)" : "none",
                          transition: "transform .15s ease",
                        }}
                      />
                    </button>
                    {isOpen && (
                      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
                        {recs.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              padding: 12,
                              borderRadius: 12,
                              border: `1px solid ${BORDER}`,
                              background: CARD,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, fontSize: 11, color: MUTED }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: NAVY, fontWeight: 600 }}>{it.title}</span>
                                {it.badge ? <span style={NEUTRAL}>{it.badge}</span> : null}
                              </span>
                              <span style={{ flexShrink: 0 }}>{formatDateTime(it.date, lang)}</span>
                            </div>
                            {it.text ? <p style={{ margin: "6px 0 0", fontSize: 13, color: NAVY, lineHeight: 1.55 }}>{it.text}</p> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </IdentityCard>
  );
}
