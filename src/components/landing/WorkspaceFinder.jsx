import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isBase44BackendConfigured } from "@/lib/localPreview";
import {
  checkWorkspaceSearchGate,
  filterWorkspacePreview,
} from "@/lib/workspaceDerivations";
import { ACCENT, BORDER, CARD, INK, MUTED, SURFACE } from "@/lib/publicChrome";

function initials(name) {
  const s = String(name || "").trim();
  return s.slice(0, 2) || "NV";
}

function metaLine(card, ar) {
  const cr = card.commercialRegistration
    ? (ar ? `سجل ${card.commercialRegistration}` : `CR ${card.commercialRegistration}`)
    : (ar ? "لم يُسجَّل رقم السجل بعد" : "No CR on file yet");
  const sites = ar
    ? (card.sites === 0 ? "لا مواقع مسجّلة بعد" : card.sites === 1 ? "موقع واحد" : card.sites === 2 ? "موقعان" : card.sites <= 10 ? `${card.sites} مواقع` : `${card.sites} موقعًا`)
    : `${card.sites} site${card.sites === 1 ? "" : "s"}`;
  const staff = ar
    ? (card.staff === 0 ? "لا موظفين بعد" : card.staff === 1 ? "موظف واحد" : card.staff === 2 ? "موظفان" : card.staff <= 10 ? `${card.staff} موظفين` : `${card.staff} موظفًا`)
    : `${card.staff} employee${card.staff === 1 ? "" : "s"}`;
  return ar
    ? [cr, sites, staff, `منذ ${card.since}`].join(" · ")
    : `${cr} · ${sites} · ${staff} · since ${card.since}`;
}

/** Design L216 */
const MARK = {
  width: "42px",
  height: "42px",
  borderRadius: "11px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: SURFACE,
  border: `1px solid ${BORDER}`,
  fontSize: "14px",
  fontWeight: 600,
  color: ACCENT,
};

function stateStyle(trial) {
  return trial
    ? {
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: "rgba(245,158,11,.16)",
        color: "#FCD34D",
        border: "1px solid rgba(245,158,11,.3)",
        whiteSpace: "nowrap",
      }
    : {
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 600,
        background: "var(--nv-accent-soft)",
        color: "var(--nv-accent-deep)",
        border: "1px solid var(--nv-accent-border)",
        whiteSpace: "nowrap",
      };
}

/** Design L217–219 */
const STAFF = {
  display: "inline-flex",
  alignItems: "center",
  height: "36px",
  padding: "0 15px",
  borderRadius: "9px",
  background: ACCENT,
  color: "#fff",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
};
const JOBS = {
  display: "inline-flex",
  alignItems: "center",
  height: "36px",
  padding: "0 15px",
  borderRadius: "9px",
  border: `1px solid ${BORDER}`,
  color: INK,
  fontSize: "12px",
  cursor: "pointer",
  textDecoration: "none",
  background: CARD,
};
const COPY = {
  height: "36px",
  padding: "0 15px",
  borderRadius: "9px",
  border: `1px solid ${BORDER}`,
  background: CARD,
  color: MUTED,
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
};

/**
 * Public tenant finder — company name / CR → staff login or careers.
 * Design: NiroVera Workspace.dc.html L42–96 (field, results, empty).
 * Server: companyDirectory.publicWorkspaceSearch. Offline: design preview seeds.
 * Demo OTP panel from design is intentionally not rebuilt (HANDOFF: no fixed demo OTP).
 */
export default function WorkspaceFinder({ lang = "ar", initialQuery = "" }) {
  const ar = lang === "ar";
  const [q, setQ] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [preview, setPreview] = useState(false);
  const timer = useRef(null);
  const toastTimer = useRef(null);

  const say = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3600);
  };

  useEffect(() => {
    if (initialQuery) setQ(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    clearTimeout(timer.current);
    const trimmed = String(q || "").trim();
    if (!trimmed) {
      setResults([]);
      setError("");
      setLoading(false);
      setPreview(false);
      return undefined;
    }

    const gate = checkWorkspaceSearchGate(trimmed);
    if (!gate.ok) {
      setResults([]);
      setError("");
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    timer.current = setTimeout(async () => {
      const cloudReady = isBase44BackendConfigured();
      if (!cloudReady) {
        const local = filterWorkspacePreview(trimmed, lang);
        setResults(local.results || []);
        setError(local.results?.length ? "" : (ar ? "لا شركة بهذا الاسم في سجل المعاينة" : "No preview company matches that name"));
        setPreview(true);
        setLoading(false);
        return;
      }
      try {
        const res = await base44.functions.invoke("companyDirectory", {
          action: "publicWorkspaceSearch",
          query: trimmed,
        });
        const data = res?.data || res || {};
        if (data.error) {
          setResults([]);
          setError(ar ? (data.reason || data.error) : (data.reasonEn || data.reason || data.error));
          setPreview(false);
        } else {
          setResults(Array.isArray(data.results) ? data.results : []);
          setError("");
          setPreview(false);
        }
      } catch {
        const local = filterWorkspacePreview(trimmed, lang);
        setResults(local.results || []);
        setError("");
        setPreview(true);
      } finally {
        setLoading(false);
      }
    }, 280);

    return () => clearTimeout(timer.current);
  }, [q, lang, ar]);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const hasQ = String(q || "").trim().length > 0;
  const empty = hasQ && !loading && results.length === 0;

  const copyLink = async (card) => {
    const url = `${window.location.origin}${card.urlPath || `/workspace/${card.slug}`}`;
    try {
      await navigator.clipboard.writeText(url);
      say(ar ? `نُسخ رابط ${card.name} — nirovera.sa/${card.slug}` : `Copied ${card.name}'s address — nirovera.sa/${card.slug}`);
    } catch {
      say(url);
    }
  };

  return (
    <div>
      <label style={{ display: "block" }}>
        <span
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 600,
            color: MUTED,
            marginBottom: "7px",
          }}
        >
          {ar ? "اسم الشركة أو رقم السجل التجاري" : "Company name or commercial registration number"}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) {
              say(ar ? `جارٍ فتح مساحة ${results[0].name}` : `Opening ${results[0].name}'s workspace`);
            }
          }}
          placeholder={ar ? "مثال: شركة الخليج للطاقة أو 1010234567" : "e.g. Gulf Power Co. or 1010234567"}
          autoComplete="organization"
          style={{
            width: "100%",
            height: "48px",
            border: `1px solid ${BORDER}`,
            borderRadius: "9px",
            background: CARD,
            padding: "0 14px",
            fontSize: "15px",
            color: INK,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </label>
      <div
        style={{
          fontSize: "11px",
          color: MUTED,
          marginTop: "8px",
          lineHeight: 1.7,
          textWrap: "pretty",
        }}
      >
        {ar
          ? "البحث يتجاهل الهمزات والتاء المربوطة، فيجد الاسم كما كتبته تقريبًا."
          : "The search ignores hamza and taa-marbuta variants, so an approximate spelling still finds the company."}
      </div>
      {preview && hasQ && (
        <div style={{ fontSize: "11px", color: "#FCD34D", marginTop: "8px" }}>
          {ar ? "معاينة محلية — السجل الحي يتطلّب خادم Base44." : "Local preview — live registry needs the Base44 backend."}
        </div>
      )}

      {hasQ && (
        <div style={{ marginTop: "14px" }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: MUTED }}>
              <Loader2 style={{ width: "14px", height: "14px" }} className="animate-spin" />
              {ar ? "جارٍ البحث في سجل الشركات…" : "Searching the company registry…"}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {results.map((card) => (
                <div
                  key={card.companyId || card.slug}
                  style={{
                    border: `1px solid ${BORDER}`,
                    borderRadius: "13px",
                    padding: "14px 16px",
                    background: SURFACE,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <span style={MARK}>{initials(card.name)}</span>
                    <span style={{ flex: "1 1 180px", minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: "15px", fontWeight: 600 }}>{card.name}</span>
                      <span style={{ display: "block", fontSize: "11px", color: MUTED, marginTop: "3px" }}>
                        {metaLine(card, ar)}
                      </span>
                    </span>
                    <span style={stateStyle(!!card.trial)}>
                      {card.trial ? (ar ? "فترة تجريبية" : "Trial") : card.plan}
                    </span>
                  </div>
                  <div
                    dir="ltr"
                    style={{
                      marginTop: "11px",
                      fontSize: "12px",
                      color: ACCENT,
                      fontFamily: "'IBM Plex Mono',monospace",
                      textAlign: ar ? "right" : "left",
                    }}
                  >
                    nirovera.sa/{card.slug}
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                    <Link to={card.staffLoginPath} style={STAFF}>
                      {ar ? "دخول الموظفين" : "Staff sign-in"}
                    </Link>
                    <Link to={card.careersPath} style={JOBS}>
                      {ar ? "صفحة الوظائف" : "Careers page"}
                    </Link>
                    <button type="button" onClick={() => copyLink(card)} style={COPY}>
                      {ar ? "انسخ الرابط" : "Copy link"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {empty && (
            <div
              style={{
                border: `1px dashed ${BORDER}`,
                borderRadius: "13px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 600 }}>
                {error || (ar ? "لا شركة بهذا الاسم في السجل" : "No company by that name in the registry")}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: MUTED,
                  marginTop: "6px",
                  lineHeight: 1.75,
                  textWrap: "pretty",
                }}
              >
                {ar
                  ? "تأكد من الاسم كما هو في السجل التجاري، أو سجّل شركتك — يُنشئ التسجيل مساحة فارغة برابطها ومالك حساب واحد."
                  : "Check the name as it appears on the commercial registration, or register your company — signing up creates an empty workspace with its own address and a single account owner."}
              </div>
              <Link
                to="/pricing?org=company"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  marginTop: "12px",
                  height: "38px",
                  padding: "0 16px",
                  borderRadius: "9px",
                  border: "none",
                  background: ACCENT,
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {ar ? "سجّل شركة جديدة" : "Register a company"}
              </Link>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          onClick={() => setToast("")}
          style={{
            position: "fixed",
            insetInlineStart: "50%",
            bottom: "26px",
            transform: "translateX(-50%)",
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 18px",
            borderRadius: "11px",
            background: CARD,
            color: INK,
            boxShadow: "0 14px 34px rgba(0,0,0,.35)",
            fontSize: "13px",
            cursor: "pointer",
            maxWidth: "calc(100vw - 48px)",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: ACCENT,
              flexShrink: 0,
            }}
          />
          <span style={{ textWrap: "pretty" }}>{toast}</span>
        </div>
      )}
    </div>
  );
}
