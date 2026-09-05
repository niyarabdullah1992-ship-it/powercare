import React from "react";
import { CARD, MUTED, NAVY, SURFACE } from "@/lib/platformStyles";
import { identityIconWrap } from "@/components/shared/IdentityCard";

export default function SearchResults({ results, active = 0, onSelect, onHover, lang, idle = false }) {
  const ar = lang === "ar";
  if (!results.length) {
    return (
      <p style={{ margin: 0, padding: "14px 12px", textAlign: "center", fontSize: 12, color: MUTED, lineHeight: 1.6 }}>
        {idle
          ? (ar ? "اكتب اسم قسم أو موظف أو فرع." : "Type a section, employee or branch name.")
          : (ar ? "لا توجد نتائج مطابقة" : "No matching results")}
      </p>
    );
  }
  return (
    <div style={{ maxHeight: 280, overflowY: "auto", padding: 4, background: SURFACE }}>
      {results.map((result, index) => {
        const Icon = result.icon;
        const on = index === active;
        return (
          <button
            key={`${result.type}-${result.id}`}
            type="button"
            onClick={() => onSelect(result)}
            onMouseEnter={() => onHover?.(index)}
            style={{
              display: "flex",
              width: "100%",
              alignItems: "center",
              gap: 8,
              padding: "5px 8px",
              minHeight: 32,
              border: "none",
              borderRadius: 9,
              background: on ? CARD : "transparent",
              boxShadow: on ? "0 1px 2px rgba(20,40,75,.06)" : "none",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "start",
            }}
          >
            <span style={{ ...identityIconWrap, width: 28, height: 28, borderRadius: 8 }}>
              {Icon ? <Icon style={{ width: 14, height: 14 }} strokeWidth={1.75} /> : null}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 12,
                  fontWeight: 600,
                  color: NAVY,
                }}
              >
                {result.label}
              </span>
              <span style={{ display: "block", fontSize: 10, color: MUTED, marginTop: 1 }}>{result.subtitle}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
