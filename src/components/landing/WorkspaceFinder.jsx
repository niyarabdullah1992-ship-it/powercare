import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { isBase44BackendConfigured } from "@/lib/localPreview";
import {
  checkWorkspaceSearchGate,
  filterWorkspacePreview,
} from "@/lib/workspaceDerivations";

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

/**
 * Public tenant finder — company name / CR → staff login or careers.
 * Server: companyDirectory.publicWorkspaceSearch. Offline: design preview seeds.
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
      say(ar ? `نُسخ رابط ${card.name}` : `Copied ${card.name}'s address`);
    } catch {
      say(url);
    }
  };

  return (
    <div className="workspace-finder">
      <label className="block">
        <span className="mb-2 block text-[11px] font-semibold text-[#C7D0E0]">
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
          className="h-12 w-full rounded-[11px] border border-white/20 bg-white/[0.06] px-3.5 text-[15px] text-[#F4F6FA] outline-none placeholder:text-[#5A6B85] focus:border-[#6EE7B7]/50"
          autoComplete="organization"
        />
      </label>
      <p className="mt-2 text-[11px] leading-relaxed text-[#A8B4C8]">
        {ar
          ? "البحث يتجاهل الهمزات والتاء المربوطة، فيجد الاسم كما كتبته تقريبًا."
          : "The search ignores hamza and taa-marbuta variants, so an approximate spelling still finds the company."}
      </p>
      {preview && hasQ && (
        <p className="mt-2 text-[11px] text-[#FCD34D]/90">
          {ar ? "معاينة محلية — السجل الحي يتطلّب خادم Base44." : "Local preview — live registry needs the Base44 backend."}
        </p>
      )}

      {hasQ && (
        <div className="mt-3.5">
          {loading && (
            <div className="flex items-center gap-2 text-[12px] text-[#A8B4C8]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {ar ? "جارٍ البحث في سجل الشركات…" : "Searching the company registry…"}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {results.map((card) => (
                <article
                  key={card.companyId}
                  className="workspace-result rounded-[13px] border border-white/15 bg-white/[0.04] p-3.5 sm:p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] border border-white/15 bg-white/[0.08] text-sm font-semibold text-[#6EE7B7]">
                      {initials(card.name)}
                    </span>
                    <span className="min-w-0 flex-1 basis-[180px]">
                      <span className="block text-[15px] font-semibold text-[#F4F6FA]">{card.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#A8B4C8]">{metaLine(card, ar)}</span>
                    </span>
                    <span
                      className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        card.trial
                          ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
                          : "border-emerald-300/30 bg-emerald-400/10 text-[#6EE7B7]"
                      }`}
                    >
                      {card.trial ? (ar ? "فترة تجريبية" : "Trial") : card.plan}
                    </span>
                  </div>
                  <div dir="ltr" className={`mt-2.5 font-mono text-xs text-[#6EE7B7] ${ar ? "text-right" : "text-left"}`}>
                    nirovera.sa/{card.slug}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to={card.staffLoginPath}
                      className="inline-flex h-9 items-center rounded-[9px] bg-[#1E9E63] px-3.5 text-xs font-semibold text-white hover:bg-[#188554]"
                    >
                      {ar ? "دخول الموظفين" : "Staff sign-in"}
                    </Link>
                    <Link
                      to={card.careersPath}
                      className="inline-flex h-9 items-center rounded-[9px] border border-white/20 px-3.5 text-xs text-[#F4F6FA] hover:border-[#6EE7B7]/40"
                    >
                      {ar ? "صفحة الوظائف" : "Careers page"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => copyLink(card)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-white/15 px-3.5 text-xs text-[#C7D0E0] hover:border-white/30"
                    >
                      <Copy className="h-3 w-3" strokeWidth={1.75} />
                      {ar ? "انسخ الرابط" : "Copy link"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {empty && (
            <div className="rounded-[13px] border border-dashed border-white/20 p-4 text-center">
              <div className="text-[13px] font-semibold text-[#F4F6FA]">
                {error || (ar ? "لا شركة بهذا الاسم في السجل" : "No company by that name in the registry")}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[#C7D0E0]">
                {ar
                  ? "تأكد من الاسم كما هو في السجل التجاري، أو سجّل شركتك — يُنشئ التسجيل مساحة فارغة برابطها ومالك حساب واحد."
                  : "Check the name as it appears on the commercial registration, or register your company — signing up creates an empty workspace with its own address and a single account owner."}
              </p>
              <Link
                to="/pricing?org=company"
                className="mt-3 inline-flex h-9 items-center rounded-[9px] bg-[#1E9E63] px-4 text-xs font-semibold text-white hover:bg-[#188554]"
              >
                {ar ? "سجّل شركة جديدة" : "Register a company"}
              </Link>
            </div>
          )}
        </div>
      )}

      {toast && (
        <button
          type="button"
          onClick={() => setToast("")}
          className="fixed bottom-6 start-1/2 z-[60] flex max-w-[calc(100vw-3rem)] -translate-x-1/2 items-center gap-2.5 rounded-[11px] bg-[#F4F6FA] px-4 py-3 text-[13px] text-[#14284B] shadow-[0_14px_34px_rgba(0,0,0,.35)]"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E9E63]" />
          <span>{toast}</span>
        </button>
      )}
    </div>
  );
}
