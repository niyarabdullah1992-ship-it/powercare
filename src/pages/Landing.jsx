import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { ShieldCheck, LogIn, Globe, ChevronDown, Check, Clock, TrendingUp, Facebook, Twitter, X as XIcon, Send, MapPin, Lock, Factory, Phone, Mail, Sparkles } from "lucide-react";
import Logo from "@/components/Logo";
import VideoIntro from "@/components/landing/VideoIntro";
import OtpStep from "@/components/landing/OtpStep";
import PasswordResetForm from "@/components/landing/PasswordResetForm";
import { trackVisit } from "@/lib/trackVisit";

const PATTERN_IMG = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/f202a53a2_generated_image.png";

export default function Landing() {
  const { t, lang, setLang, languages } = useI18n();
  const { login, verifyOtp, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpPending, setOtpPending] = useState(null); // pendingId while awaiting the emailed code
  const [resetOpen, setResetOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang);

  useEffect(() => {
    if (session) navigate("/app");
  }, [session, navigate]);

  // Anonymous visit tracking (once per browser session) — powers the Owner Panel stats.
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

  const handleCompanyLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const r = await login(email, password);
    if (!r) setError(lang === "ar" ? "البريد أو كلمة المرور غير صحيحة" : "Incorrect email or password");
    else if (r.otpRequired) setOtpPending(r.pendingId);
    setSubmitting(false);
    // r.company → session set, useEffect above redirects to /app
  };

  const handleVerifyOtp = async (code) => {
    const c = await verifyOtp(otpPending, code, password);
    return !!c;
  };

  return (
    <div className="min-h-screen bg-landing-bg font-body text-primary">
      {/* Top bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-landing-gold/15 bg-landing-bg/90 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-10 md:py-4">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-heading font-semibold text-lg text-primary">{t("appName")}</span>
        </div>
        <div className="flex items-center gap-2">
        <Link
          to="/pricing"
          className="px-4 py-1.5 rounded-full bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-body font-semibold hover:opacity-90 transition-opacity"
        >
          {t("viewPlans")}
        </Link>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-landing-gold/25 bg-white text-sm font-body text-[#3a2f22]/90 hover:bg-white/70 transition-colors"
          >
            <Globe className="w-4 h-4" strokeWidth={1.75} />
            <span>{currentLang?.flag} {currentLang?.code.toUpperCase()}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${langOpen ? "rotate-180" : ""}`} strokeWidth={1.75} />
          </button>
          {langOpen && (
            <div className="absolute end-0 mt-2 w-48 rounded-md border border-landing-gold/20 bg-white shadow-lg z-50 overflow-hidden max-h-72 overflow-y-auto">
              {languages.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-body transition-colors ${
                    lang === l.code ? "bg-landing-gold text-white" : "text-[#3a2f22]/80 hover:bg-landing-bg"
                  }`}
                >
                  <span>{l.flag} {l.code.toUpperCase()}</span>
                  {lang === l.code && <Check className="w-3.5 h-3.5" strokeWidth={2} />}
                </button>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <img src={PATTERN_IMG} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:px-10 md:py-24 lg:grid-cols-[1.15fr,0.85fr] lg:gap-16">
          <div className="text-center lg:text-start">
            <h1 className="hero-title break-words text-5xl uppercase text-landing-gold sm:text-6xl md:text-8xl">{t("appName")}</h1>

            <div className="mx-auto mt-8 max-w-lg divide-y divide-[#3a2f22]/8 overflow-hidden rounded-2xl border border-landing-gold/15 bg-white shadow-sm lg:mx-0 lg:mt-10">
              <FeatureBullet icon={Clock} title={t("feature1")} />
              <FeatureBullet icon={TrendingUp} title={t("feature2")} />
              <FeatureBullet icon={ShieldCheck} title={t("feature3")} />
            </div>
          </div>

          {/* Login card */}
          <div className="rounded-2xl border border-landing-gold/15 bg-white p-5 shadow-xl shadow-[#3a2f22]/10 sm:p-7">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-body bg-landing-bg text-[#3a2f22]">
                <LogIn className="w-4 h-4" strokeWidth={1.75} /> {t("companyLogin")}
              </span>
            </div>

              {otpPending ? (
                <OtpStep email={email} onVerify={handleVerifyOtp} onBack={() => setOtpPending(null)} />
              ) : resetOpen ? (
                <PasswordResetForm initialEmail={email} onDone={(value) => { setEmail(value); setResetOpen(false); setError(""); }} onBack={() => setResetOpen(false)} />
              ) : (
              <form onSubmit={handleCompanyLogin} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-body text-[#3a2f22]/55 mb-1.5">{t("email")}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] font-body text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-body text-[#3a2f22]/55 mb-1.5">{t("password")}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] font-body text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold"
                  />
                </div>
                {error && <p className="text-sm text-red-500 font-body">{error}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-wait"
                >
                  {submitting ? t("pleaseWaitBtn") : t("login")}
                </button>
                <button type="button" onClick={() => { setResetOpen(true); setError(""); }} className="w-full cursor-pointer text-center text-sm font-body font-semibold text-landing-gold underline underline-offset-4 hover:text-landing-gold-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-landing-gold">
                  {lang === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?"}
                </button>
              </form>
              )}
              <p className="mt-5 text-center text-sm font-body text-[#3a2f22]/55">
                {t("noAccountYet")}{" "}
                <Link to="/pricing" className="text-landing-gold font-semibold hover:underline">
                  {t("viewPlans")}
                </Link>
              </p>
          </div>
        </div>
      </div>

      <VideoIntro />

      {/* Gold gradient section: brand mark + benefits + footer */}
      <div className="bg-gradient-to-b from-landing-gold-light via-landing-gold-deep to-landing-bg px-6 md:px-10 pt-16 pb-4">
        <div className="flex flex-col items-center">
          <Logo size={72} />
          <h2 className="hero-title text-primary text-5xl md:text-6xl mt-3 mb-10">{t("appName")}</h2>
        </div>

        {/* Ribbon */}
        <div className="max-w-3xl mx-auto flex items-center justify-center gap-3 bg-black/15 rounded-full px-6 py-3 text-center text-sm font-body mb-14">
          <Sparkles className="w-4 h-4 text-white/70 shrink-0" strokeWidth={1.75} />
          <p>
            <span className="text-white font-semibold">{t("benefitAnnounce")}</span>{" "}
            <span className="text-white/75">{t("benefitAnnounceText")}</span>
          </p>
          <Sparkles className="w-4 h-4 text-white/70 shrink-0" strokeWidth={1.75} />
        </div>

        {/* Benefits section */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <BenefitCard icon={MapPin} title={t("benefit1Title")} text={t("benefit1Text")} />
          <BenefitCard icon={Lock} title={t("benefit2Title")} text={t("benefit2Text")} />
          <BenefitCard icon={Factory} title={t("benefit3Title")} text={t("benefit3Text")} />
        </div>

        {/* Footer */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 mt-16 pt-10 border-t border-[#3a2f22]/10">
          <div>
            <h3 className="font-heading text-2xl text-[#3a2f22] mb-3">{t("appName")}</h3>
            <p className="text-sm text-[#3a2f22]/55 font-body leading-relaxed">
              {t("footerDescription")}
            </p>
            <div className="flex items-center gap-4 mt-5 text-[#3a2f22]/60">
              <Facebook className="w-4 h-4" strokeWidth={1.75} />
              <Twitter className="w-4 h-4" strokeWidth={1.75} />
              <XIcon className="w-4 h-4" strokeWidth={1.75} />
              <Send className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <h4 className="font-heading text-lg text-[#3a2f22] mb-3">{t("footerBenefitsHeading")}</h4>
            <ul className="space-y-2 text-sm font-body text-[#3a2f22]/55">
              <li>{t("footerBlog")}</li>
              <li><a href="/about" className="hover:text-landing-gold transition-colors">{t("footerAbout")}</a></li>
              <li>{t("footerCareers")}</li>
              <li>{t("footerTerms")}</li>
              <li>{t("footerContact")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-[#3a2f22] mb-3">{t("footerContactHeading")}</h4>
            <ul className="space-y-2.5 text-sm font-body text-[#3a2f22]/55">
              <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-landing-gold" /> {t("appName")}</li>
              <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-landing-gold" /> <span dir="ltr">0595414472</span></li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-landing-gold" /> niyar@powercares.pro</li>
              <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-landing-gold" /> turkialmutarir@gmail.com</li>
            </ul>
          </div>
        </div>
      </div>
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