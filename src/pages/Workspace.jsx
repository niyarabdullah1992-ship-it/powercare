import React, { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import WorkspaceFinder from "@/components/landing/WorkspaceFinder";
import MarketingChrome from "@/components/landing/MarketingChrome";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { trackVisit } from "@/lib/trackVisit";
import { ACCENT, BORDER, CARD, INK, MUTED, SURFACE } from "@/lib/publicChrome";

const MODEL = [
  {
    n: "1",
    arTitle: "عزل البيانات لا تصفيتها",
    enTitle: "Isolation, not filtering",
    arBody:
      "بيانات كل شركة في نطاقها الخاص، فلا يوجد استعلام يمكن أن يُخطئ فيرى شركة أخرى — وهو فرق جوهري عن نظام واحد يفصل الشركات بشرط في الاستعلام.",
    enBody:
      "Each company's data lives in its own tenant, so no query can slip and read another company's records — a real difference from one shared system separating tenants by a filter clause.",
  },
  {
    n: "2",
    arTitle: "رابط يحمل اسم الشركة",
    enTitle: "An address that carries the name",
    arBody:
      "المرشح والعميل والمورّد يفتحون رابط الشركة لا رابطًا عامًا، فتظهر لهم هوية الشركة وشواغرها هي وحدها.",
    enBody:
      "Candidates, clients and suppliers open the company's own address rather than a shared one, seeing that company's identity and its vacancies alone.",
  },
  {
    n: "3",
    arTitle: "مالك حساب واحد مسؤول",
    enTitle: "One accountable owner",
    arBody:
      "لكل مساحة مالك واحد يملك تعديل المعايير والصلاحيات، ويُقيَّد كل تغيير باسمه — فلا صلاحية بلا مسؤول.",
    enBody:
      "Every workspace has a single owner who can change criteria and permissions, with each change recorded in their name — no authority without an accountable person.",
  },
  {
    n: "4",
    arTitle: "إعدادات نظامية لكل منشأة",
    enTitle: "Statutory settings per establishment",
    arBody:
      "رقم المنشأة في التأمينات ونطاقها في السعودة وأيام العمل ولائحة الجزاءات تختلف من شركة لأخرى، فتُضبط في مساحتها لا في إعداد عام.",
    enBody:
      "The GOSI establishment number, the Saudization band, working days and the disciplinary regulations differ per company, so they are set inside its workspace rather than in one global configuration.",
  },
];

/** Design L201 numStyle */
const NUM_STYLE = {
  width: "24px",
  height: "24px",
  borderRadius: "50%",
  background: "var(--nv-accent-soft)",
  color: "var(--nv-accent-deep)",
  fontSize: "11px",
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  fontFamily: "'IBM Plex Sans',sans-serif",
};

/**
 * Public company workspace finder (tenant entry).
 * Design: NiroVera Workspace.dc.html L24–118 — shell + canvas composition literal.
 * Staff auth stays on /login/:portal (OTP). Careers stays one-way public intake.
 */
export default function Workspace() {
  const { lang, setLang } = useI18n();
  const { session, currentUser } = useAuth();
  const loggedIn = Boolean(session?.userId && currentUser);
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const ar = lang === "ar";
  const initialQuery = String(slug || searchParams.get("q") || searchParams.get("company") || "").trim();

  useEffect(() => {
    trackVisit("/workspace");
  }, []);

  const toggleLang = () => setLang(ar ? "en" : "ar");

  return (
    <MarketingChrome ar={ar} lang={lang} loggedIn={loggedIn} onToggleLang={toggleLang} ctaHref="/login">
    <div
      style={{
        background: SURFACE,
        color: INK,
      }}
    >

      {/* L33–34 — canvas */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "24px 22px 60px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "640px" }}>
          {/* L36–39 — hero (canvas composition) */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", color: ACCENT, fontWeight: 600 }}>
              {ar ? "مساحة عمل الشركة" : "COMPANY WORKSPACE"}
            </div>
            <h1
              style={{
                margin: "12px 0 0",
                fontSize: "30px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.3,
                textWrap: "pretty",
              }}
            >
              {ar ? "اكتب اسم شركتك للدخول إلى مساحتها" : "Type your company's name to reach its workspace"}
            </h1>
            <div
              style={{
                fontSize: "13px",
                color: MUTED,
                marginTop: "10px",
                lineHeight: 1.8,
                textWrap: "pretty",
              }}
            >
              {ar
                ? "كل شركة مسجَّلة لها مساحتها المستقلة برابطها الخاص: بيانات موظفيها وفروعها وتقاريرها لا تُخالط شركة أخرى، ولوحة التوظيف العامة تحمل اسمها."
                : "Every registered company has its own workspace on its own address: its employees, stations and records never mix with another tenant's, and its public careers page carries its name."}
            </div>
          </div>

          {/* L42 — search board shell (finder internals = next slice) */}
          <div
            style={{
              marginTop: "22px",
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: "16px",
              padding: "18px 20px",
            }}
          >
            <WorkspaceFinder lang={lang} initialQuery={initialQuery} />
          </div>

          {/* L99–112 — model board */}
          <div
            style={{
              marginTop: "16px",
              background: CARD,
              border: `1px solid ${BORDER}`,
              borderRadius: "16px",
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 600 }}>
              {ar ? "لماذا مساحة لكل شركة" : "Why a workspace per company"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              {MODEL.map((m, i) => (
                <div
                  key={m.n}
                  style={{
                    display: "flex",
                    gap: "12px",
                    padding: "11px 0",
                    borderTop: `1px solid ${BORDER}`,
                  }}
                >
                  <span style={NUM_STYLE}>{m.n}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "12px", fontWeight: 600 }}>
                      {ar ? m.arTitle : m.enTitle}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: MUTED,
                        lineHeight: 1.75,
                        marginTop: "3px",
                        textWrap: "pretty",
                      }}
                    >
                      {ar ? m.arBody : m.enBody}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* L114–116 */}
          <div style={{ textAlign: "center", marginTop: "18px" }}>
            <span style={{ fontSize: "11px", color: MUTED }}>
              {ar ? "NiroVera — منصة إدارة العمليات والقوى العاملة" : "NiroVera — operations and workforce platform"}
            </span>
          </div>
        </div>
      </main>

      {/* App-only links / IP badge — absent from Workspace.dc.html primary */}
      <details
        style={{
          margin: "0 22px 24px",
          padding: "12px 14px",
          borderRadius: "11px",
          border: `1px solid ${BORDER}`,
          background: CARD,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: 600,
            color: MUTED,
            listStyle: "none",
          }}
        >
          {ar ? "روابط إضافية (تطبيق)" : "Extra links (app)"}
        </summary>
        <div
          style={{
            marginTop: "12px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 16px",
            fontSize: "12px",
            color: MUTED,
          }}
        >
          <Link to="/login" style={{ color: MUTED }}>{ar ? "بوابات الدخول" : "Login portals"}</Link>
          <Link to="/careers" style={{ color: MUTED }}>{ar ? "الوظائف" : "Careers"}</Link>
          <Link to="/pricing?org=company" style={{ color: MUTED }}>{ar ? "تسجيل شركة" : "Register company"}</Link>
          <Link to="/" style={{ color: MUTED }}>{ar ? "الرئيسية" : "Home"}</Link>
        </div>
      </details>
    </div>
    </MarketingChrome>
  );
}
