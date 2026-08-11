import React, { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Check, Globe, Mail, Phone, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import SalesDeckStage from "@/components/landing/SalesDeckStage";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import { SALES_DECK_SLIDES } from "@/lib/salesDeckContent";
import { useI18n } from "@/lib/i18n";
import { trackVisit } from "@/lib/trackVisit";

function clampIndex(n, total) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(total - 1, n));
}

export default function SalesDeck() {
  const { t, lang, setLang, languages } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const ar = lang === "ar";
  const currentLang = languages.find((l) => l.code === lang);
  const total = SALES_DECK_SLIDES.length;

  const indexFromUrl = (() => {
    const raw = searchParams.get("slide");
    if (!raw) return 0;
    const asId = SALES_DECK_SLIDES.findIndex((s) => s.id === raw);
    if (asId >= 0) return asId;
    return clampIndex(Number.parseInt(raw, 10) - 1, total);
  })();

  const [index, setIndex] = useState(indexFromUrl);

  useEffect(() => {
    trackVisit("/deck");
  }, []);

  useEffect(() => {
    setIndex(indexFromUrl);
  }, [indexFromUrl]);

  const goTo = useCallback(
    (next) => {
      const clamped = clampIndex(next, total);
      setIndex(clamped);
      const slide = SALES_DECK_SLIDES[clamped];
      setSearchParams({ slide: slide.id }, { replace: true });
    },
    [setSearchParams, total],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

      const forward = ar ? e.key === "ArrowLeft" : e.key === "ArrowRight";
      const backward = ar ? e.key === "ArrowRight" : e.key === "ArrowLeft";

      if (forward || e.key === "PageDown" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        next();
        return;
      }
      if (backward || e.key === "PageUp" || e.key === "ArrowUp") {
        e.preventDefault();
        prev();
        return;
      }
      if (e.key === "Home") {
        e.preventDefault();
        goTo(0);
      }
      if (e.key === "End") {
        e.preventDefault();
        goTo(total - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [ar, goTo, next, prev, total]);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  const slide = SALES_DECK_SLIDES[index];
  const notes = ar ? slide.notesAr : slide.notesEn;

  return (
    <div className="powercare-public min-h-screen bg-[#08142F] font-body text-[#101828]" dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1A3F]/95 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-4 sm:px-6 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo size={24} />
            <span className="font-heading text-base font-semibold tracking-tight">NiroVera</span>
          </Link>
          <nav className="ms-2 hidden items-center gap-4 sm:flex">
            <Link to="/" className="text-[12.5px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <Link to="/mobile" className="text-[12.5px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الميدان" : "Field"}
            </Link>
            <Link to="/careers" className="text-[12.5px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الوظائف" : "Careers"}
            </Link>
            <Link to="/pricing" className="text-[12.5px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الباقات" : "Pricing"}
            </Link>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <p className="me-1 hidden text-[12px] text-[#8C9AB8] lg:block">
              {ar ? slide.labelAr : slide.labelEn}
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((v) => !v);
                }}
                className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-2 text-xs text-[#C7D2E6] hover:bg-white/10"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{currentLang?.flag}</span>
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
                      {lang === l.code && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/"
              className="rounded-lg bg-[#0E7A4B] px-3.5 py-2 text-[13px] text-white hover:bg-[#0B5F3A]"
            >
              {ar ? "اطلب عرضًا" : "Request demo"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-0 md:px-6 md:pt-6 lg:px-8">
        <div className="relative aspect-[16/10] min-h-[min(72vh,620px)] w-full md:min-h-[560px]">
          <SalesDeckStage slides={SALES_DECK_SLIDES} index={index} ar={ar} />

          <button
            type="button"
            onClick={prev}
            disabled={index === 0}
            aria-label={ar ? "الشريحة السابقة" : "Previous slide"}
            className="absolute start-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-[#0B1A3F]/70 p-2.5 text-white backdrop-blur disabled:opacity-30 md:inline-flex"
          >
            {ar ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={index === total - 1}
            aria-label={ar ? "الشريحة التالية" : "Next slide"}
            className="absolute end-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-white/20 bg-[#0B1A3F]/70 p-2.5 text-white backdrop-blur disabled:opacity-30 md:inline-flex"
          >
            {ar ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 py-5 sm:px-0 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[13px] text-white disabled:opacity-35 md:hidden"
            >
              {ar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {ar ? "السابق" : "Prev"}
            </button>
            <button
              type="button"
              onClick={next}
              disabled={index === total - 1}
              className="inline-flex items-center gap-1 rounded-lg bg-[#0E7A4B] px-3 py-2 text-[13px] text-white disabled:opacity-35 md:hidden"
            >
              {ar ? "التالي" : "Next"}
              {ar ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            <p className="font-heading text-sm text-[#A8B4C8]" dir="ltr">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </p>
          </div>

          <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1" role="tablist" aria-label={ar ? "شرائح العرض" : "Deck slides"}>
            {SALES_DECK_SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                title={ar ? s.labelAr : s.labelEn}
                onClick={() => goTo(i)}
                className={`h-2 w-2 shrink-0 rounded-full transition-all ${
                  i === index ? "w-6 bg-[#3FBF80]" : "bg-white/25 hover:bg-white/45"
                }`}
              />
            ))}
          </div>

          <p className="hidden max-w-md text-end text-[12px] leading-relaxed text-[#7B879C] lg:block">
            {ar ? "← → للتنقل · Home / End" : "← → to navigate · Home / End"}
          </p>
        </div>

        {notes ? (
          <aside className="mb-8 border border-white/10 bg-white/[0.03] px-4 py-4 text-[13px] leading-relaxed text-[#A8B4C8] sm:px-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-[#3FBF80]">
              {ar ? "ملاحظات المتحدث" : "SPEAKER NOTES"}
            </p>
            <p className="mt-2">{notes}</p>
          </aside>
        ) : null}
      </main>

      <footer className="border-t border-white/10 bg-[#061028] px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-2xl text-white">NiroVera</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {ar
                ? "عرض تعريفي للمستثمرين والمشترين — دورة إثبات واحدة للمحطات."
                : "Investor and buyer briefing — one proof cycle for stations."}
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
                <Link to="/pricing" className="hover:text-[#3FBF80]">
                  {ar ? "الباقات" : "Pricing"}
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-[#3FBF80]">
                  {t("footerCareers")}
                </Link>
              </li>
              <li>
                <Link to="/" className="hover:text-[#3FBF80]">
                  {ar ? "اطلب عرضًا" : "Request demo"}
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
        <div className="mx-auto max-w-[1200px]">
          <IpCertificateBadge lang={lang} />
        </div>
      </footer>
    </div>
  );
}
