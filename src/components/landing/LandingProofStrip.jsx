import React from "react";
import { ACCENT, BORDER, CARD, INK, MUTED, SURFACE } from "@/lib/publicChrome";

const STEPS = [
  {
    n: "01",
    ar: "حضور",
    en: "Attendance",
    arSub: "شخص · مكان · وقت",
    enSub: "Person · place · time",
  },
  {
    n: "02",
    ar: "مهمة",
    en: "Task",
    arSub: "وزن جهد وإثبات",
    enSub: "Effort weight & proof",
  },
  {
    n: "03",
    ar: "مراجعة",
    en: "Review",
    arSub: "اعتماد بسبب مكتوب",
    enSub: "Approve with reason",
  },
  {
    n: "04",
    ar: "تصعيد",
    en: "Escalate",
    arSub: "عند نفاد الحصة الزمنية",
    enSub: "When time quota burns",
  },
  {
    n: "05",
    ar: "ختم",
    en: "Seal",
    arSub: "توقيع وتحقق عام",
    enSub: "Sign & public verify",
  },
];

/**
 * Proof Cycle strip for the public landing — calm timeline, NiroVera tokens.
 */
export default function LandingProofStrip({ ar }) {
  return (
    <section
      id="proof-cycle"
      data-nv="pad"
      style={{
        padding: "72px 48px",
        background: SURFACE,
        borderTop: `1px solid ${BORDER}`,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: ACCENT, fontWeight: 600 }}>
          {ar ? "سلسلة الإثبات" : "PROOF CYCLE"}
        </div>
        <h2
          data-nv="h2"
          style={{
            margin: "16px 0 0",
            fontSize: "40px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            maxWidth: "780px",
            textWrap: "pretty",
          }}
        >
          {ar
            ? "الموارد البشرية التي تُثبت العمل — لا تسجّله فحسب"
            : "HR that proves work was done — not only records it"}
        </h2>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: "18px",
            color: MUTED,
            maxWidth: "700px",
            lineHeight: 1.65,
          }}
        >
          {ar
            ? "من الحضور إلى الختم للعميل — سلسلة واحدة تغذي المسير والامتثال والتقارير دون إعادة إدخال."
            : "From attendance to the client seal — one chain feeding payroll, compliance and reporting without re-entry."}
        </p>

        <div
          data-nv="proof-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "12px",
            marginTop: "40px",
          }}
        >
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              style={{
                background: CARD,
                border: `1px solid ${BORDER}`,
                borderRadius: "16px",
                padding: "20px 18px",
                position: "relative",
              }}
            >
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    insetInlineEnd: "-10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: ACCENT,
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "none",
                  }}
                  data-nv="proof-arrow"
                >
                  →
                </span>
              ) : null}
              <div
                dir="ltr"
                style={{
                  fontFamily: "'IBM Plex Sans',sans-serif",
                  fontSize: "12px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  color: MUTED,
                }}
              >
                {s.n}
              </div>
              <div style={{ marginTop: "10px", fontSize: "17px", fontWeight: 600, color: INK }}>
                {ar ? s.ar : s.en}
              </div>
              <div style={{ marginTop: "6px", fontSize: "13px", color: MUTED, lineHeight: 1.55 }}>
                {ar ? s.arSub : s.enSub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
