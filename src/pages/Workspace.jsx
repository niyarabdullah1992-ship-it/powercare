import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Check, ChevronDown, Globe } from "lucide-react";
import Logo from "@/components/Logo";
import WorkspaceFinder from "@/components/landing/WorkspaceFinder";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import { useI18n } from "@/lib/i18n";
import { trackVisit } from "@/lib/trackVisit";

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

/**
 * Public company workspace finder (tenant entry).
 * Design: NiroVera Workspace.dc.html — recreate intent; no HTML/support.js paste.
 * Staff auth stays on /login/:portal (OTP). Careers stays one-way public intake.
 */
export default function Workspace() {
  const { t, lang, setLang, languages } = useI18n();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [langOpen, setLangOpen] = useState(false);
  const ar = lang === "ar";
  const currentLang = languages.find((l) => l.code === lang);
  const initialQuery = String(slug || searchParams.get("q") || searchParams.get("company") || "").trim();

  useEffect(() => {
    trackVisit("/workspace");
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  return (
    <div
      className="powercare-public workspace-page min-h-screen font-body text-[#F4F6FA]"
      dir={ar ? "rtl" : "ltr"}
      style={{
        background: "radial-gradient(1200px 600px at 50% -10%, #172A4D 0%, #0E1B33 60%)",
      }}
    >
      <header className="flex items-center gap-3 px-5 py-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Logo size={26} />
          <span className="font-heading text-base font-semibold tracking-tight">NiroVera</span>
        </Link>
        <nav className="ms-2 hidden items-center gap-4 md:flex">
          <Link to="/" className="text-[12.5px] text-[#A8B4C8] transition-colors hover:text-white">
            {ar ? "الرئيسية" : "Home"}
          </Link>
          <Link to="/careers" className="text-[12.5px] text-[#A8B4C8] transition-colors hover:text-white">
            {ar ? "الوظائف" : "Careers"}
          </Link>
          <Link to="/login" className="text-[12.5px] text-[#A8B4C8] transition-colors hover:text-white">
            {ar ? "بوابات الدخول" : "Login portals"}
          </Link>
        </nav>
        <div className="ms-auto flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLangOpen((v) => !v);
              }}
              className="flex h-[30px] items-center gap-1.5 rounded-lg border border-white/15 bg-transparent px-3 text-xs font-semibold text-[#C7D0E0] hover:bg-white/5"
            >
              <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span>{ar ? "EN" : "ع"}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
            </button>
            {langOpen && (
              <div className="absolute end-0 z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-white/15 bg-[#14284B] py-1 shadow-xl">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                      lang === l.code ? "bg-white/10 text-[#6EE7B7]" : "text-[#C7D0E0] hover:bg-white/5"
                    }`}
                  >
                    <span>
                      {l.flag} {l.label}
                    </span>
                    {lang === l.code ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-col px-5 pb-16 pt-6 sm:px-6">
        <div className="workspace-hero text-center">
          <div className="text-[11px] font-semibold tracking-[0.14em] text-[#6EE7B7]">
            {ar ? "مساحة عمل الشركة" : "COMPANY WORKSPACE"}
          </div>
          <h1 className="mt-3 font-heading text-[28px] font-semibold leading-snug tracking-tight text-[#F4F6FA] sm:text-[30px]">
            {ar ? "اكتب اسم شركتك للدخول إلى مساحتها" : "Type your company's name to reach its workspace"}
          </h1>
          <p className="mx-auto mt-2.5 max-w-[34rem] text-[13px] leading-relaxed text-[#C7D0E0]">
            {ar
              ? "كل شركة مسجَّلة لها مساحتها المستقلة برابطها الخاص: بيانات موظفيها ومحطاتها وتقاريرها لا تُخالط شركة أخرى، ولوحة التوظيف العامة تحمل اسمها."
              : "Every registered company has its own workspace on its own address: its employees, stations and records never mix with another tenant's, and its public careers page carries its name."}
          </p>
        </div>

        <div className="workspace-panel mt-5 rounded-2xl border border-white/15 bg-white/[0.05] p-4 sm:p-5">
          <WorkspaceFinder lang={lang} initialQuery={initialQuery} />
        </div>

        <div className="workspace-panel mt-4 rounded-2xl border border-white/15 bg-white/[0.05] p-4 sm:p-5">
          <h2 className="text-[13px] font-semibold text-[#F4F6FA]">
            {ar ? "لماذا مساحة لكل شركة" : "Why a workspace per company"}
          </h2>
          <div className="mt-2 flex flex-col">
            {MODEL.map((m) => (
              <div key={m.n} className="flex gap-3 border-t border-white/10 py-2.5 first:border-t-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6EE7B7]/15 text-[11px] font-semibold text-[#6EE7B7]">
                  {m.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-semibold text-[#F4F6FA]">{ar ? m.arTitle : m.enTitle}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#C7D0E0]">{ar ? m.arBody : m.enBody}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#5A6B85]">
          {ar ? "NiroVera — منصة إدارة العمليات والقوى العاملة" : "NiroVera — operations and workforce platform"}
          {currentLang ? ` · ${currentLang.label}` : ""}
        </p>
      </main>

      <footer className="border-t border-white/10 px-5 py-6 sm:px-6">
        <div className="mx-auto flex max-w-[640px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[12px] text-[#A8B4C8]">
          <Link to="/login" className="hover:text-[#6EE7B7]">{ar ? "بوابات الدخول" : "Login portals"}</Link>
          <Link to="/careers" className="hover:text-[#6EE7B7]">{t("footerCareers")}</Link>
          <Link to="/pricing?org=company" className="hover:text-[#6EE7B7]">
            {ar ? "تسجيل شركة" : "Register company"}
          </Link>
          <Link to="/" className="hover:text-[#6EE7B7]">{ar ? "الرئيسية" : "Home"}</Link>
        </div>
        <div className="mx-auto max-w-[640px]">
          <IpCertificateBadge lang={lang} />
        </div>
      </footer>
    </div>
  );
}
