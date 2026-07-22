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
    <div className="powercare-public min-h-screen bg-landing-cinema font-body text-foreground">
      <header className="sticky top-0 z-50 border-b border-accent/20 bg-landing-cinema/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="font-heading text-lg font-semibold text-white">{t("appName")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/pricing" className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground shadow-sm hover:bg-accent/90">
              {t("viewPlans")}
            </Link>
            <div className="relative">
              <button onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }} className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
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

      <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 md:px-10 md:pb-20 md:pt-16">
        <Image src={PATTERN_IMG} alt="" originWidth={1536} originHeight={1024} fittingType="fill" className="absolute inset-0 h-full w-full opacity-20" />
        <div className="relative mx-auto max-w-6xl">
          <div dir={lang === "ar" ? "rtl" : "ltr"} className="mb-8 max-w-2xl text-start md:ms-auto">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Enterprise company management</p>
            <h1 className="font-heading text-5xl font-semibold leading-none text-white sm:text-6xl md:text-7xl">{t("appName")}</h1>
            <p className="mt-4 text-base leading-relaxed text-white/65 md:text-lg">{t("heroSubtitle")}</p>
          </div>

          <div dir="ltr" className="grid items-center gap-8 lg:grid-cols-[1.35fr,0.75fr] lg:gap-12">
            <div className="relative flex min-h-[260px] items-center justify-center sm:min-h-[340px]">
              <Image src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/6fc1a76fc_generated_image.png" alt={lang === "ar" ? "موظف مبتسم يعمل على منصة PowerCare" : "Smiling professional working with PowerCare"} originWidth={1536} originHeight={1024} fittingType="fit" className="h-full max-h-[360px] w-full" />
            </div>

            <div dir={lang === "ar" ? "rtl" : "ltr"} className="rounded-2xl border border-white/15 bg-card/95 p-6 shadow-2xl sm:p-7">
              <div className="flex justify-center"><Logo size={44} /></div>
              <h2 className="mt-4 text-center font-heading text-2xl font-semibold text-foreground">{lang === "ar" ? "اختر نوع تسجيل الدخول الخاص بك" : "Choose your login type"}</h2>
              <div className="mt-6"><PowerCareLoginPanel showTypeSelector returnPath="/" /></div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <FeatureBullet icon={Clock} title={t("feature1")} />
            <FeatureBullet icon={TrendingUp} title={t("feature2")} />
            <FeatureBullet icon={ShieldCheck} title={t("feature3")} />
          </div>
        </div>
      </section>

      <StatsBand lang={lang} />
      <VideoIntro />

      <section className="bg-landing-bg px-4 py-16 sm:px-6 md:px-10 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-center text-center">
            <Logo size={56} />
            <h2 className="mt-4 font-heading text-4xl font-semibold text-primary md:text-5xl">{lang === "ar" ? "لماذا PowerCare؟" : "Why PowerCare?"}</h2>
          </div>

          <WhyPowerCare lang={lang} />

          <div className="mx-auto mb-10 flex max-w-3xl items-center justify-center gap-3 rounded-full border border-accent/25 bg-card px-6 py-3 text-center text-sm shadow-sm">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
            <p><span className="font-semibold text-primary">{t("benefitAnnounce")}</span>{" "}<span className="text-muted-foreground">{t("benefitAnnounceText")}</span></p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <BenefitCard icon={MapPin} title={t("benefit1Title")} text={t("benefit1Text")} />
            <BenefitCard icon={Lock} title={t("benefit2Title")} text={t("benefit2Text")} />
            <BenefitCard icon={Factory} title={t("benefit3Title")} text={t("benefit3Text")} />
          </div>
        </div>
      </section>

      <footer className="border-t border-accent/20 bg-landing-cinema px-6 py-12 md:px-10">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
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
    <div className="flex min-h-20 items-center gap-3 rounded-xl border border-accent/75 bg-landing-cinema/80 px-5 py-4 text-white shadow-lg shadow-accent/15">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
      <p className="text-sm leading-relaxed text-white/85">{title}</p>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-6 shadow-sm">
      <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-accent/15 text-accent"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
      <h3 className="font-heading text-xl font-semibold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}