import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { BORDER, BRAND, BRAND_DEEP, BRAND_SOFT, CARD, INK, MUTED, SURFACE, field } from "@/lib/platformStyles";

function rowStyle(on) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    minHeight: 34,
    padding: "0 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12.5,
    textAlign: "start",
    border: "1px solid transparent",
    background: on ? BRAND_SOFT : "transparent",
    color: on ? BRAND_DEEP : INK,
    fontWeight: on ? 600 : 400,
  };
}

const chip = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  height: 24,
  padding: "0 6px 0 8px",
  borderRadius: 999,
  border: `1px solid ${BRAND}`,
  background: BRAND_SOFT,
  color: BRAND_DEEP,
  fontSize: 11,
  fontWeight: 600,
};

/** Branch picker — closed by default, opens into a searchable checklist with chips for the picks. */
export default function OpsStationMultiSelect({ stations = [], value = [], onChange, ar }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const sorted = useMemo(
    () => [...stations].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), ar ? "ar" : "en")),
    [stations, ar],
  );
  const q = query.trim().toLowerCase();
  const visible = q ? sorted.filter((s) => String(s.name || "").toLowerCase().includes(q)) : sorted;
  const selected = sorted.filter((s) => value.includes(s.id));
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const allOn = stations.length > 0 && value.length === stations.length;

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ ...field, width: "100%", display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "start" }}
      >
        <span style={{ flex: 1, fontSize: 12.5, color: value.length ? INK : MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value.length
            ? (allOn
              ? (ar ? "كل الفروع" : "All branches")
              : (ar ? `${value.length} فرع مختار` : `${value.length} branches selected`))
            : (ar ? "اختر الفرع / الفروع" : "Select branch(es)")}
        </span>
        <ChevronDown style={{ width: 14, height: 14, color: MUTED, transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {!open && selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {selected.slice(0, 6).map((s) => (
            <span key={s.id} style={chip}>
              {s.name}
              <X style={{ width: 12, height: 12, cursor: "pointer" }} onClick={() => toggle(s.id)} />
            </span>
          ))}
          {selected.length > 6 && (
            <span style={{ ...chip, border: `1px dashed ${BORDER}`, background: SURFACE, color: MUTED }}>
              +{selected.length - 6}
            </span>
          )}
        </div>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            insetInline: 0,
            zIndex: 70,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            background: CARD,
            boxShadow: "0 14px 30px rgba(20,40,75,.14)",
            overflow: "hidden",
          }}
        >
          {stations.length > 6 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
              <Search style={{ width: 13, height: 13, color: MUTED, flexShrink: 0 }} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={ar ? "ابحث عن فرع…" : "Search a branch…"}
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 12.5, fontFamily: "inherit", color: INK }}
              />
            </div>
          )}

          <div style={{ maxHeight: 208, overflowY: "auto", padding: 6 }}>
            {visible.length === 0 ? (
              <div style={{ fontSize: 11.5, color: MUTED, padding: "10px 8px" }}>{ar ? "لا فرع مطابق." : "No matching branch."}</div>
            ) : (
              visible.map((s) => {
                const on = value.includes(s.id);
                return (
                  <button key={s.id} type="button" onClick={() => toggle(s.id)} style={rowStyle(on)}>
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        border: `1px solid ${on ? BRAND : BORDER}`,
                        background: on ? BRAND : CARD,
                      }}
                    >
                      {on && <Check style={{ width: 11, height: 11, color: "#fff" }} />}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                  </button>
                );
              })
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderTop: `1px solid ${BORDER}`, background: SURFACE }}>
            <span style={{ fontSize: 11, color: MUTED }}>
              {ar ? `${value.length} من ${stations.length}` : `${value.length} of ${stations.length}`}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {stations.length > 1 && (
                <button
                  type="button"
                  onClick={() => onChange(allOn ? [] : stations.map((s) => s.id))}
                  style={{ height: 28, padding: "0 10px", borderRadius: 8, border: `1px dashed ${BORDER}`, background: CARD, color: MUTED, fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}
                >
                  {allOn ? (ar ? "إلغاء الكل" : "Clear all") : (ar ? "تحديد الكل" : "Select all")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ height: 28, padding: "0 12px", borderRadius: 8, border: `1px solid ${BRAND}`, background: BRAND, color: "#fff", fontSize: 11, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}
              >
                {ar ? "تم" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}