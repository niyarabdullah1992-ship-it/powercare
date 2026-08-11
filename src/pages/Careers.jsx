import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, ChevronDown, Globe, Mail, Phone, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import CareersIntake from "@/components/landing/CareersIntake";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import { useI18n } from "@/lib/i18n";
import { trackVisit } from "@/lib/trackVisit";

export default function Careers() {
  const { t, lang, setLang, languages } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const ar = lang === "ar";
  const currentLang = languages.find((l) => l.code === lang);

  const companyId = String(searchParams.get("company") || "").trim();
  const jobKey = String(searchParams.get("job") || "").trim();

  useEffect(() => {
    trackVisit("/careers");
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  const onJobChange = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key) next.set("job", key);
    else next.delete("job");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="powercare-public min-h-screen bg-[#F7F8FA] font-body text-[#101828]" dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 text-[#14284B] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[960px] items-center gap-3 px-5 sm:px-6">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo size={22} />
            <span className="font-heading text-[17px] font-semibold tracking-tight">NiroVera</span>
          </Link>
          <span className="hidden h-4 w-px bg-[#E2E8F0] sm:block" />
          <span className="hidden text-[13px] text-[#5A6B85] sm:inline">{ar ? "الوظائف" : "Careers"}</span>
          <nav className="ms-2 hidden items-center gap-4 md:flex">
            <Link to="/" className="text-[12.5px] text-[#5A6B85] transition-colors hover:text-[#0E7A4B]">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <Link to="/mobile" className="text-[12.5px] text-[#5A6B85] transition-colors hover:text-[#0E7A4B]">
              {ar ? "الميدان" : "Field"}
            </Link>
            <Link to="/deck" className="text-[12.5px] text-[#5A6B85] transition-colors hover:text-[#0E7A4B]">
              {ar ? "العرض" : "Deck"}
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
                className="flex h-8 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-[12px] font-semibold text-[#5A6B85] hover:bg-[#F7F8FA]"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>{ar ? "EN" : "ع"}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute end-0 z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-[#E4E7EC] bg-white py-1 text-[#101828] shadow-xl">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                        lang === l.code ? "bg-[#E8F3ED] text-[#0E7A4B]" : "hover:bg-[#F7F8FA]"
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
            <Link
              to="/login"
              className="hidden rounded-lg border border-[#E2E8F0] px-3 py-2 text-[12px] font-semibold text-[#5A6B85] hover:border-[#0E7A4B] hover:text-[#0E7A4B] sm:inline-flex"
            >
              {ar ? "دخول المنصة" : "Platform login"}
            </Link>
          </div>
        </div>
      </header>

      <section className="careers-hero border-b border-[#E2E8F0] bg-[#0B1A3F] text-white">
        <div className="careers-hero-mesh mx-auto max-w-[960px] px-5 py-10 sm:px-6 sm:py-12">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6EE7B7]">
            {ar ? "قناة المتقدمين العامة" : "PUBLIC CANDIDATE CHANNEL"}
          </p>
          <h1 className="mt-3 font-heading text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] sm:text-[42px]">
            NiroVera
            <span className="mt-1 block text-[22px] font-medium tracking-normal text-[#B9C3D8] sm:text-[24px]">
              {ar ? "الوظائف — بلا حساب موظف" : "Careers — no employee account"}
            </span>
          </h1>
          <p className="mt-4 max-w-[34rem] text-[15px] leading-relaxed text-[#A8B4C8]">
            {ar
              ? "قدّم على شاغر معلن في دقيقتين. الطلب يدخل طابور التوظيف باتجاه واحد — هذه الصفحة لا تقرأ بيانات الموظفين أو الرواتب."
              : "Apply to a posted role in two minutes. Applications enter the hiring queue one way — this page never reads employee or payroll data."}
          </p>
          {!companyId ? (
            <p className="mt-5 text-[12.5px] text-[#8C9AB8]">
              {currentLang?.flag}{" "}
              {ar
                ? "أسفل الصفحة أدوار توضيحية للمنتج. للتقديم الحقيقي استخدم رابط الشركة من التوظيف."
                : "Below are illustrative product roles. For a real application, use the company link from Recruitment."}
            </p>
          ) : null}
        </div>
      </section>

      <main>
        <CareersIntake
          ar={ar}
          companyId={companyId || null}
          initialJobKey={jobKey || null}
          onJobChange={onJobChange}
        />
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
          <span className="text-[11px] text-[#5A6B85]">
            {ar
              ? "NiroVera — منصة إدارة العمليات والقوى العاملة"
              : "NiroVera — operations and workforce platform"}
          </span>
          <span className="ms-auto text-[11px] text-[#5A6B85]">
            {ar
              ? "نوظّف على الكفاءة وحدها، ونرحّب بطلبات الأشخاص ذوي الإعاقة."
              : "We hire on merit alone and welcome applications from persons with disabilities."}
          </span>
        </div>
        <div className="border-t border-[#E2E8F0] bg-[#08142F] px-5 py-8 sm:px-6">
          <div className="mx-auto grid max-w-[960px] gap-7 md:grid-cols-3">
            <div>
              <h3 className="font-heading text-2xl text-white">NiroVera</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/50">
                {ar
                  ? "التقديم العام ≠ دخول الموظف — طابور باتجاه واحد إلى التوظيف."
                  : "Public apply ≠ employee login — one-way queue into Recruitment."}
              </p>
            </div>
            <div>
              <h4 className="font-heading text-lg text-white">{ar ? "روابط" : "Links"}</h4>
              <ul className="mt-3 space-y-2 text-sm text-white/55">
                <li>
                  <Link to="/" className="hover:text-[#3FBF80]">
                    {ar ? "الرئيسية" : "Home"}
                  </Link>
                </li>
                <li>
                  <Link to="/mobile" className="hover:text-[#3FBF80]">
                    {ar ? "تطبيق الميدان" : "Field companion"}
                  </Link>
                </li>
                <li>
                  <Link to="/deck" className="hover:text-[#3FBF80]">
                    {ar ? "عرض المبيعات" : "Sales deck"}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-[#3FBF80]">
                    {ar ? "دخول المنصة" : "Enter platform"}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading text-lg text-white">{t("footerContactHeading")}</h4>
              <ul className="mt-3 space-y-2.5 text-sm text-white/55">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#3FBF80]" />
                  {ar ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#3FBF80]" />
                  <a href="tel:+966595414472" dir="ltr" className="hover:text-[#3FBF80]">
                    0595414472
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-[#3FBF80]" />
                  <a href="mailto:niyar@powercares.pro" className="hover:text-[#3FBF80]">
                    niyar@powercares.pro
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mx-auto max-w-[960px]">
            <IpCertificateBadge lang={lang} />
          </div>
        </div>
      </footer>
    </div>
  );
}
