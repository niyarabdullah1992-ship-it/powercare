import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Globe, ChevronDown, Check, Clock, TrendingUp, Facebook, Twitter, X as XIcon, Send, MapPin, Lock, Factory, Phone, Mail, Sparkles, BookOpen } from "lucide-react";
import Logo from "@/components/Logo";
import { Image } from "@/components/ui/image";
import VideoIntro from "@/components/landing/VideoIntro";
import StatsBand from "@/components/landing/StatsBand";
import { trackVisit } from "@/lib/trackVisit";
import WhyPowerCare from "@/components/landing/WhyPowerCare";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import PlatformServices from "@/components/landing/PlatformServices";

const PATTERN_IMG = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/613ed91a1_generated_image.png";

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
    <div className="powercare-public min-h-screen bg-landing-bg font-body text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-landing-bg/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1440px] flex-row-reverse items-center justify-between px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-2">
            <Logo size={26} />
            <span className="font-heading text-base font-semibold text-foreground">PowerCare</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/pricing" className="rounded-md bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
              {t("viewPlans")}
            </Link>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground hover:bg-muted">
                <Globe className="h-4 w-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
              </button>
              {langOpen && (
                <div className="absolute end-0 z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-xl">
                  {languages.map((l) => (
                    <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }} className={`flex w-full items-center justify-between px-3 py-2 text-sm ${lang === l.code ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}>
                      <span>{l.flag} {l.label}</span>
                      {lang === l.code && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-6 pt-9 sm:px-6 md:px-8 md:pt-10">
        <div className="relative mx-auto max-w-[1380px]">
          <div dir={lang === "ar" ? "rtl" : "ltr"} className="mx-auto mb-6 max-w-4xl text-center">
            <p className="mb-2 text-sm font-medium text-foreground">{lang === "ar" ? "إدارة شركات إنتربرايز" : "Enterprise company management"}</p>
            <h1 className="font-heading text-5xl font-semibold leading-none tracking-[-0.04em] text-foreground sm:text-6xl md:text-7xl">PowerCare</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base font-medium leading-relaxed text-foreground md:text-lg">{t("heroSubtitle")}</p>
          </div>

          <div dir="ltr" className="grid items-stretch gap-4 lg:h-[520px] lg:grid-cols-[2fr,1fr]">
            <div className="relative min-h-[300px] overflow-hidden rounded-2xl border border-landing-gold/25 bg-secondary shadow-elevated lg:h-full lg:min-h-0 lg:rounded-se-[8rem]">
              <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/cfc4c89b6_1.jpg" alt={lang === "ar" ? "فريق قيادي متنوع يتعاون ضمن بيئة مؤسسية حديثة" : "A diverse leadership team collaborating in a modern corporate workplace"} originWidth={1024} originHeight={575} fittingType="fit" className="absolute inset-0 h-full w-full bg-primary" />
            </div>

            <div dir={lang === "ar" ? "rtl" : "ltr"} className="flex h-full flex-col justify-center rounded-2xl border border-landing-gold/25 bg-card p-5 shadow-soft">
              <div className="flex justify-center"><Logo size={34} /></div>
              <h2 className="mt-2 text-center font-heading text-lg font-medium text-foreground">{lang === "ar" ? "اختر نوع تسجيل الدخول الخاص بك" : "Choose your login type"}</h2>
              <div className="mt-3"><PowerCareLoginPanel showTypeSelector returnPath="/" /></div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <FeatureBullet icon={Clock} title={t("feature1")} />
            <FeatureBullet icon={TrendingUp} title={t("feature2")} />
            <FeatureBullet icon={ShieldCheck} title={t("feature3")} />
          </div>
        </div>
      </section>

      <StatsBand lang={lang} />
      <PlatformServices lang={lang} />
      <VideoIntro />

      <section className="border-t border-border bg-landing-bg px-4 py-14 sm:px-6 md:px-8 md:py-16">
        <div className="mx-auto max-w-[1380px]">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size={36} />
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">{lang === "ar" ? "لماذا PowerCare؟" : "Why PowerCare?"}</h2>
          </div>

          <WhyPowerCare lang={lang} />

          <div className="mx-auto mb-7 flex max-w-3xl items-center justify-center gap-3 rounded-full border border-border bg-card px-6 py-3 text-center text-xs">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
            <p><span className="font-semibold text-primary">{t("benefitAnnounce")}</span>{" "}<span className="text-muted-foreground">{t("benefitAnnounceText")}</span></p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <BenefitCard icon={MapPin} title={t("benefit1Title")} text={t("benefit1Text")} />
            <BenefitCard icon={Lock} title={t("benefit2Title")} text={t("benefit2Text")} />
            <BenefitCard icon={Factory} title={t("benefit3Title")} text={t("benefit3Text")} />
          </div>
        </div>
      </section>

      <footer className="border-t border-foreground/10 bg-landing-cinema px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-6xl gap-7 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-2xl text-white">{t("appName")}</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">{t("footerDescription")}</p>
            <Link to="/manual" className="mt-4 inline-flex items-center gap-2 rounded-lg border border-accent/40 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent hover:text-accent-foreground"><BookOpen className="h-3.5 w-3.5" />{lang === "ar" ? "كتيب المستخدم" : "User Handbook"}</Link>
            <div className="mt-5 flex items-center gap-4 text-white/45"><Facebook className="h-4 w-4" /><Twitter className="h-4 w-4" /><XIcon className="h-4 w-4" /><Send className="h-4 w-4" /></div>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{t("footerBenefitsHeading")}</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li><Link to="/about" className="hover:text-accent">{t("footerAbout")}</Link></li><li><Link to="/security" className="hover:text-accent">{lang === "ar" ? "الأمان والامتثال" : "Security & Compliance"}</Link></li><li><Link to="/terms" className="hover:text-accent">{t("footerTerms")}</Link></li><li><Link to="/privacy" className="hover:text-accent">{lang === "ar" ? "الخصوصية" : "Privacy"}</Link></li><li><a href="mailto:niyar@powercares.pro" className="hover:text-accent">{t("footerContact")}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{t("footerContactHeading")}</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-white/55">
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-accent" />{lang === "ar" ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"}</li><li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-accent" /><a href="tel:+966595414472" dir="ltr" className="hover:text-accent">0595414472</a></li><li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-accent" /><a href="mailto:niyar@powercares.pro" className="hover:text-accent">niyar@powercares.pro</a></li><li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-accent" /><a href="mailto:turkialmutarir@gmail.com" className="hover:text-accent">turkialmutarir@gmail.com</a></li>
            </ul>
          </div>
        </div>
        <IpCertificateBadge lang={lang} />
      </footer>
    </div>
  );
}

function FeatureBullet({ icon: Icon, title }) {
  return (
    <div className="flex min-h-14 items-center justify-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-foreground">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-accent"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
      <p className="text-center text-xs font-medium leading-relaxed">{title}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-secondary text-accent"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
      <h3 className="font-heading text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}