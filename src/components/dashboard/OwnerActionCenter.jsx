import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Banknote, ReceiptText, AlertTriangle, ShieldAlert, CalendarOff,
  FileText, PenLine, MessageCircle, Camera, CheckCircle2, ArrowLeft, ArrowRight,
} from "lucide-react";
import { deriveOwnerActions } from "@/lib/ownerActionCenter";
import { ACCENT, BORDER, CARD, INK, MUTED, SURFACE, NAVY_FILL } from "@/lib/platformStyles";

const ICONS = {
  payroll: Banknote,
  expenses: ReceiptText,
  tasks: AlertTriangle,
  safety: ShieldAlert,
  leave: CalendarOff,
  daily: FileText,
  signing: PenLine,
  complaints: MessageCircle,
  proof: Camera,
};

const SEVERITY = {
  high: { color: "#DC2626", soft: "#FEF2F2", border: "#FECACA" },
  medium: { color: "#B45309", soft: "#FFFBEB", border: "#FDE68A" },
  low: { color: "var(--nv-accent-deep, #15803D)", soft: "var(--nv-accent-soft, #ECFDF3)", border: "var(--nv-accent-border, #BBF7D0)" },
};

function formatMoney(amount, ar) {
  const value = new Intl.NumberFormat(ar ? "ar-SA" : "en-US", { maximumFractionDigits: 0 }).format(Math.round(amount || 0));
  return ar ? `${value} ر.س` : `${value} SAR`;
}

/**
 * Owner Action Center — one ranked, money-aware decision queue that spans every
 * section (money · trust · people · operations · care). Rendered at the top of
 * the command center so the owner sees, in one glance, what needs a decision and
 * how much money is waiting on it — each row drilling into the section that fixes it.
 */
export default function OwnerActionCenter({ data, stationIds = null, lang = "ar" }) {
  const ar = lang === "ar";
  const { items, categories, totalItems, moneyAtStake } = useMemo(
    () => deriveOwnerActions(data, { stationIds }),
    [data, stationIds],
  );
  const Arrow = ar ? ArrowLeft : ArrowRight;

  return (
    <section
      dir={ar ? "rtl" : "ltr"}
      style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}
    >
      {/* Navy header band — the owner's cockpit, money made visible */}
      <div style={{ background: NAVY_FILL, color: "#fff", padding: "18px 20px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#6EE7B7", fontWeight: 600 }}>
            {ar ? "مركز قرارات المالك" : "OWNER ACTION CENTER"}
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 6, letterSpacing: "-0.01em" }}>
            {ar ? "ما ينتظر اعتمادك الآن" : "What needs your approval now"}
          </div>
          <div style={{ fontSize: 11, color: "#A8B4C8", marginTop: 4 }}>
            {ar ? "من كل الأقسام — مرتّبة بالأثر والمال، لا بالتاريخ" : "Across every section — ranked by impact and money, not by date"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
          <HeaderStat value={categories} label={ar ? "قرار معلّق" : "open decisions"} />
          <HeaderStat
            value={formatMoney(moneyAtStake, ar)}
            label={ar ? "مبلغ ينتظر قرارك" : "riyal awaiting you"}
            accent
            wide
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: "34px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <CheckCircle2 style={{ width: 30, height: 30, color: ACCENT }} strokeWidth={1.75} />
          <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{ar ? "كل القرارات مغلقة" : "All decisions are closed"}</div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {ar ? "لا شيء ينتظر اعتمادك في أي قسم الآن." : "Nothing awaits your approval in any section right now."}
          </div>
        </div>
      ) : (
        <div>
          {items.map((item, index) => {
            const Icon = ICONS[item.key] || AlertTriangle;
            const tone = SEVERITY[item.severity] || SEVERITY.medium;
            return (
              <Link
                key={item.key}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 20px",
                  borderTop: index === 0 ? "none" : `1px solid ${BORDER}`,
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: tone.soft, border: `1px solid ${tone.border}`, color: tone.color,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Icon style={{ width: 19, height: 19 }} strokeWidth={1.9} />
                </span>
                <span style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 600, color: INK, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ar ? item.titleAr : item.titleEn}
                  </span>
                  <span style={{ display: "block", fontSize: 11.5, color: MUTED, marginTop: 2 }}>
                    {ar ? item.detailAr : item.detailEn}
                  </span>
                </span>
                {item.amount != null && item.amount > 0 && (
                  <span
                    dir={ar ? "rtl" : "ltr"}
                    style={{
                      flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: INK,
                      fontFamily: "'IBM Plex Sans',sans-serif", whiteSpace: "nowrap",
                    }}
                  >
                    {formatMoney(item.amount, ar)}
                  </span>
                )}
                <span
                  style={{
                    flexShrink: 0, minWidth: 26, height: 22, padding: "0 8px", borderRadius: 20,
                    background: tone.soft, border: `1px solid ${tone.border}`, color: tone.color,
                    fontSize: 12, fontWeight: 700, fontFamily: "'IBM Plex Sans',sans-serif",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {item.count}
                </span>
                <span style={{ flexShrink: 0, color: MUTED, display: "inline-flex" }}>
                  <Arrow style={{ width: 16, height: 16 }} strokeWidth={2} />
                </span>
              </Link>
            );
          })}
          <div style={{ padding: "10px 20px", background: SURFACE, borderTop: `1px solid ${BORDER}`, fontSize: 11, color: MUTED }}>
            {ar
              ? `${totalItems} بندًا موزّعة على ${categories} قرارًا — اضغط أي صف لتفتح القسم الذي يغلقه.`
              : `${totalItems} items across ${categories} decisions — tap any row to open the section that closes it.`}
          </div>
        </div>
      )}
    </section>
  );
}

function HeaderStat({ value, label, accent = false, wide = false }) {
  return (
    <div
      style={{
        background: accent ? "rgba(110,231,183,.14)" : "rgba(255,255,255,.08)",
        border: `1px solid ${accent ? "rgba(110,231,183,.35)" : "rgba(255,255,255,.14)"}`,
        borderRadius: 12, padding: "10px 14px", minWidth: wide ? 130 : 76, textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Sans',sans-serif", fontWeight: 700, lineHeight: 1,
          fontSize: wide ? 17 : 24, color: accent ? "#6EE7B7" : "#fff",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: "#A8B4C8", marginTop: 5 }}>{label}</div>
    </div>
  );
}
