import React from "react";
import {
  ACCENT,
  BORDER,
  BRAND_BORDER,
  BRAND_SOFT,
  CARD,
  INK,
  MUTED,
  NAVY,
  ON_NAVY,
  SURFACE,
} from "@/lib/publicChrome";

/**
 * Enterprise entry path — layer on one site for 90 days; measure proof outcomes.
 */
export default function EnterprisePilotPath({ ar }) {
  const T = (a, e) => (ar ? a : e);

  const steps = [
    {
      n: "01",
      title: T("موقع واحد فقط", "One site only"),
      text: T(
        "فرع أو منصة تشغيل — دون استبدال أنظمة المؤسسة في اليوم الأول.",
        "One station or operating platform — without replacing enterprise systems on day one.",
      ),
    },
    {
      n: "02",
      title: T("سلسلة الإثبات تعمل", "Proof Cycle runs"),
      text: T(
        "حضور → مهمة → اعتماد → تصعيد → توقيع → إثبات للعميل — بنفس السلسلة.",
        "Attendance → task → review → escalation → sign → client proof — the same chain.",
      ),
    },
    {
      n: "03",
      title: T("تقيسون قبل التوسّع", "Measure before scale"),
      text: T(
        "زمن إغلاق المهام، نسبة الإثبات، تأخير التصعيد، شكاوى الموقع — ثم توسّعون.",
        "Task close time, proof rate, escalation delay, site complaints — then you expand.",
      ),
    },
  ];

  const trust = [
    T("عزل بيانات كل شركة", "Per-company data isolation"),
    T("سجل تدقيق لكل تغيير", "Audit trail on every change"),
    T("صلاحيات من الدور والهيكل", "Role- and structure-based access"),
    T("عربي أصيل للميدان", "Native Arabic for the field"),
  ];

  return (
    <section
      id="enterprise-pilot"
      data-nv="pad"
      style={{
        padding: "80px 48px",
        background: CARD,
        borderTop: `1px solid ${BORDER}`,
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "7px 14px", borderRadius: "20px", border: `1px solid ${BRAND_BORDER}`, background: BRAND_SOFT }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
          <span style={{ fontSize: "13px", color: "var(--nv-accent-deep)", fontWeight: 500 }}>
            {T("للشركات الكبيرة · مسار تجريبي", "For large enterprises · pilot path")}
          </span>
        </div>

        <h2
          data-nv="h2"
          style={{ margin: "18px 0 0", fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em", maxWidth: "820px", lineHeight: 1.25 }}
        >
          {T(
            "لا تستبدل نظامكم غدًا — أضيفوا طبقة إثبات على موقع واحد",
            "Don't replace your ERP tomorrow — add a proof layer on one site",
          )}
        </h2>
        <p style={{ margin: "16px 0 0", fontSize: "18px", color: MUTED, maxWidth: "720px", lineHeight: 1.65 }}>
          {T(
            "نيروفيرا تدخل كتشغيل ميداني قابل للقياس فوق ما لديكم: 90 يومًا، فرع واحد، نتائج واضحة قبل أي توسّع.",
            "NiroVera enters as measurable field operations on top of what you have: 90 days, one station, clear results before any scale-up.",
          )}
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: "18px", marginTop: "44px" }}>
          {steps.map((s) => (
            <div key={s.n} style={{ borderTop: `2px solid ${NAVY}`, paddingTop: "22px" }}>
              <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "13px", fontWeight: 600, color: ACCENT, letterSpacing: "0.08em" }}>
                {s.n}
              </div>
              <div style={{ marginTop: "10px", fontSize: "19px", fontWeight: 600, color: INK }}>{s.title}</div>
              <p style={{ margin: "12px 0 0", fontSize: "15px", lineHeight: 1.7, color: MUTED }}>{s.text}</p>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "40px",
            borderRadius: "16px",
            border: `1px solid ${BORDER}`,
            background: SURFACE,
            padding: "28px 26px",
            display: "flex",
            flexWrap: "wrap",
            gap: "22px",
            alignItems: "center",
          }}
        >
          <div style={{ flex: "1 1 280px" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: INK }}>
              {T("ثقة مؤسسية من اليوم الأول", "Institutional trust from day one")}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "14px" }}>
              {trust.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--nv-accent-deep)",
                    background: BRAND_SOFT,
                    border: `1px solid ${BRAND_BORDER}`,
                    borderRadius: "20px",
                    padding: "6px 12px",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <a
              href="#contact"
              style={{
                height: "44px",
                padding: "0 22px",
                borderRadius: "9px",
                background: ACCENT,
                color: ON_NAVY,
                fontSize: "14px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              {T("اطلب تجريب موقع", "Request a site pilot")}
            </a>
            <a
              href="#proof-cycle"
              style={{
                height: "44px",
                padding: "0 22px",
                borderRadius: "9px",
                background: CARD,
                color: INK,
                border: `1px solid ${BORDER}`,
                fontSize: "14px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              {T("سلسلة الإثبات", "Proof Cycle")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
