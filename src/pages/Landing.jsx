import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Globe, ChevronDown, Check, Clock, TrendingUp, Facebook, Twitter, X as XIcon, Send, MapPin, Lock, Factory, Phone, Mail, Sparkles, Download, Building2, UserRound } from "lucide-react";
import Logo from "@/components/Logo";
import VideoIntro from "@/components/landing/VideoIntro";
import StatsBand from "@/components/landing/StatsBand";
import { trackVisit } from "@/lib/trackVisit";
import WhyPowerCare from "@/components/landing/WhyPowerCare";

const PATTERN_IMG = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/f202a53a2_generated_image.png";

export default function Landing() {
  const { t, lang, setLang, languages } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang);

  useEffect(() => {
    trackVisit("/");
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  return (
    <div className="min-h-screen bg-landing-bg font-body text-primary">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-landing-gold/15 bg-landing-bg/90 px-4 py-3 shadow-sm backdrop-blur-xl sm:px-6 md:px-10 md:py-4">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-heading font-semibold text-lg text-primary">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/pricing" className="rounded-xl bg-gradient-to-b from-landing-gold-light to-landing-gold px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            {t("viewPlans")}
          </Link>
          <div className="relative">
            <button onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }} className="flex items-center gap-2 rounded-xl border border-landing-gold/25 bg-card px-3 py-2 text-sm text-primary shadow-sm hover:bg-secondary">
              <Globe className="w-4 h-4" strokeWidth={1.75} />
              <span>{currentLang?.flag} {currentLang?.label}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
            </button>
            {langOpen && (
              <div className="absolute end-0 mt-2 w-48 rounded-md border border-landing-gold/20 bg-white shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
                {languages.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2 text-sm font-body transition-colors ${lang === l.code ? "bg-landing-gold text-white" : "text-[#3a2f22]/80 hover:bg-landing-bg"}`}>
                    <span>{l.flag} {l.label}</span>
                    {lang === l.code && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden">
        <img src={PATTERN_IMG} alt="" width="1536" height="1024" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div dir="ltr" className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:px-10 md:py-24 lg:grid-cols-[0.85fr,1.15fr] lg:gap-16">
          <div dir={lang === "ar" ? "rtl" : "ltr"} className="text-center lg:order-2 lg:text-start">
            <h1 className="hero-title break-words text-5xl uppercase text-landing-gold sm:text-6xl md:text-8xl">{t("appName")}</h1>
            <p className="mx-auto mt-5 max-w-lg text-base font-body leading-relaxed text-[#3a2f22]/65 lg:mx-0">{t("heroSubtitle")}</p>
            <div className="mx-auto mt-8 max-w-lg lg:mx-0">
              <img src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/0c8f66d08_generated_image.png" alt={lang === "ar" ? "لوحة تحكم PowerCare" : "PowerCare dashboard"} width="1024" height="640" fetchPriority="high" className="w-full h-auto drop-shadow-2xl" />
            </div>
            <div className="mx-auto mt-8 max-w-lg divide-y divide-[#3a2f22]/8 overflow-hidden rounded-2xl border border-landing-gold/15 bg-white shadow-sm lg:mx-0 lg:mt-10">
              <FeatureBullet icon={Clock} title={t("feature1")} />
              <FeatureBullet icon={TrendingUp} title={t("feature2")} />
              <FeatureBullet icon={ShieldCheck} title={t("feature3")} />
            </div>
          </div>

          <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-1 rounded-3xl border border-landing-gold/20 bg-card p-7 shadow-elevated sm:mx-0 sm:p-9 lg:order-1">
            <Logo size={56} />
            <h2 className="mt-6 font-heading text-3xl font-semibold text-primary">{lang === "ar" ? "اختر نوع تسجيل الدخول" : "Choose your login type"}</h2>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link to="/login?type=company" className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-landing-gold-light to-landing-gold px-5 py-4 text-center text-sm font-semibold text-white shadow-sm hover:opacity-90"><Building2 className="h-5 w-5" />{lang === "ar" ? "دخول الشركات" : "Company login"}</Link>
              <Link to="/login?type=individual" className="flex items-center justify-center gap-2 rounded-xl border border-landing-gold/30 px-5 py-4 text-center text-sm font-semibold text-primary hover:bg-landing-bg"><UserRound className="h-5 w-5" />{lang === "ar" ? "دخول الأفراد" : "Individual login"}</Link>
            </div>
          </div>
        </div>
      </div>

      <StatsBand lang={lang} />
      <VideoIntro />
      <GoldDivider />

      <div className="bg-gradient-to-b from-landing-gold-light via-landing-gold-deep to-landing-bg px-6 md:px-10 pt-16 pb-4">
        <div className="flex flex-col items-center">
          <Logo size={72} />
          <h2 className="hero-title text-primary text-5xl md:text-6xl mt-3 mb-10">{t("appName")}</h2>
        </div>
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 bg-black/15 rounded-full px-6 py-3 text-center text-sm font-body mb-14">
          <Sparkles className="w-4 h-4 text-white/70 shrink-0" strokeWidth={1.75} />
          <p><span className="text-white font-semibold">{t("benefitAnnounce")}</span>{" "}<span className="text-white/75">{t("benefitAnnounceText")}</span></p>
          <Sparkles className="w-4 h-4 text-white/70 shrink-0" strokeWidth={1.75} />
        </div>

        <WhyPowerCare lang={lang} />

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <BenefitCard icon={MapPin} title={t("benefit1Title")} text={t("benefit1Text")} />
          <BenefitCard icon={Lock} title={t("benefit2Title")} text={t("benefit2Text")} />
          <BenefitCard icon={Factory} title={t("benefit3Title")} text={t("benefit3Text")} />
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 mt-16 pt-10 border-t border-[#3a2f22]/10">
          <div>
            <h3 className="font-heading text-2xl text-[#3a2f22] mb-3">{t("appName")}</h3>
            <p className="text-sm text-[#3a2f22]/55 font-body leading-relaxed">{t("footerDescription")}</p>
            <Link to="/manual" className="mt-4 inline-flex items-center gap-2 rounded-full border border-landing-gold/40 px-4 py-2 text-sm font-body font-semibold text-landing-gold transition-colors hover:bg-landing-gold hover:text-white">
              <Download className="h-3.5 w-3.5" />
              {lang === "ar" ? "الدليل التشغيلي الشامل" : "Complete Operations Manual"}
            </Link>
            <div className="flex items-center gap-4 mt-5 text-[#3a2f22]/60">
              <Facebook className="w-4 h-4" strokeWidth={1.75} />
              <Twitter className="w-4 h-4" strokeWidth={1.75} />
              <XIcon className="w-4 h-4" strokeWidth={1.75} />
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-lg text-[#3a2f22] mb-3">{t("footerBenefitsHeading")}</h4>
            <ul className="space-y-2 text-sm font-body text-[#3a2f22]/70">
              <li><Link to="/about" className="hover:text-landing-gold transition-colors">{t("footerAbout")}</Link></li>
              <li><Link to="/security" className="hover:text-landing-gold transition-colors">{lang === "ar" ? "الأمان والامتثال" : "Security & Compliance"}</Link></li>
              <li><Link to="/terms" className="hover:text-landing-gold transition-colors">{t("footerTerms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-landing-gold transition-colors">{lang === "ar" ? "الخصوصية" : "Privacy"}</Link></li>
              <li><a href="mailto:niyar@powercares.pro" className="hover:text-landing-gold transition-colors">{t("footerContact")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-[#3a2f22] mb-3">{t("footerContactHeading")}</h4>
            <ul className="space-y-2.5 text-sm font-body text-[#3a2f22]/55">
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-landing-gold" /> {lang === "ar" ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"}</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-landing-gold" /> <a href="tel:+966595414472" dir="ltr" className="hover:text-landing-gold">0595414472</a></li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-landing-gold" /> <a href="mailto:niyar@powercares.pro" className="hover:text-landing-gold">niyar@powercares.pro</a></li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-landing-gold" /> <a href="mailto:turkialmutarir@gmail.com" className="hover:text-landing-gold">turkialmutarir@gmail.com</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoldDivider() {
  return (
    <div className="flex items-center justify-center gap-3 bg-landing-bg py-2">
      <span className="h-px w-24 bg-gradient-to-r from-transparent to-landing-gold/50" />
      <span className="h-1.5 w-1.5 rotate-45 bg-landing-gold" />
      <span className="h-px w-24 bg-gradient-to-l from-transparent to-landing-gold/50" />
    </div>
  );
}

function FeatureBullet({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="w-9 h-9 rounded-full border border-landing-gold/40 flex items-center justify-center shrink-0 text-landing-gold">
        <Icon className="w-4 h-4" strokeWidth={1.75} />
      </span>
      <p className="text-[#3a2f22]/80 font-body text-sm leading-relaxed">{title}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="bg-landing-olive-card rounded-2xl p-6 shadow-sm">
      <span className="w-12 h-12 rounded-xl bg-landing-bg flex items-center justify-center mb-4 text-landing-gold">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </span>
      <h3 className="font-heading text-xl text-[#3a2f22] mb-2">{title}</h3>
      <p className="text-sm text-[#3a2f22]/55 font-body leading-relaxed">{text}</p>
    </div>
  );
}