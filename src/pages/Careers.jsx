import React, { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CareersIntake from "@/components/landing/CareersIntake";
import MarketingChrome from "@/components/landing/MarketingChrome";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { trackVisit } from "@/lib/trackVisit";

/**
 * Public careers — NiroVera Careers.dc.html L24–191 shell (literal).
 * Apply board stays CareersIntake (server hiring). Invented dark hero / nav demoted.
 */
export default function Careers() {
  const { lang, setLang } = useI18n();
  const { session, currentUser } = useAuth();
  const loggedIn = Boolean(session?.userId && currentUser);
  const [searchParams, setSearchParams] = useSearchParams();
  const ar = lang === "ar";
  const T = (a, e) => (ar ? a : e);

  const companyId = String(searchParams.get("company") || "").trim();
  const jobKey = String(searchParams.get("job") || "").trim();

  useEffect(() => {
    trackVisit("/careers");
  }, []);

  const onJobChange = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set("job", key);
    else next.delete("job");
    setSearchParams(next, { replace: true });
  };

  return (
    <MarketingChrome ar={ar} lang={lang} loggedIn={loggedIn} onToggleLang={() => setLang(ar ? "en" : "ar")} ctaHref="/pricing">

      {/* L38 */}
      <main style={{ maxWidth: "960px", marginInline: "auto", padding: "26px 22px 60px" }}>
        <CareersIntake
          ar={ar}
          companyId={companyId || null}
          initialJobKey={jobKey}
          onJobChange={onJobChange}
        />
      </main>

      <p style={{ maxWidth: 960, margin: "0 auto", padding: "0 22px 8px", fontSize: 11, color: "var(--nv-muted)" }}>
        {T("قناة متقدمين عامة · ليست دخول موظف · تكافؤ فرص", "Public candidate channel · not employee login · equal opportunity")}
        {companyId ? ` · ${companyId}` : ""}
      </p>

      <details
        style={{
          maxWidth: "960px",
          margin: "0 auto 24px",
          padding: "12px 22px",
        }}
      >
        <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "var(--nv-muted)", listStyle: "none" }}>
          {T("روابط إضافية (تطبيق)", "Extra links (app)")}
        </summary>
        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "12px 16px", fontSize: "12px" }}>
          <Link to="/" style={{ color: "var(--nv-muted)" }}>{T("الرئيسية", "Home")}</Link>
          <Link to="/workspace" style={{ color: "var(--nv-muted)" }}>{T("مساحة الشركة", "Workspace")}</Link>
          <Link to="/login" style={{ color: "var(--nv-muted)" }}>{T("دخول المنصة", "Platform login")}</Link>
        </div>
      </details>
    </MarketingChrome>
  );
}
