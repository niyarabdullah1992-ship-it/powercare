import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { ShieldCheck, Globe, ChevronDown, Check, Clock, TrendingUp, Facebook, Twitter, X as XIcon, Send, MapPin, Lock, Factory, Phone, Mail, Sparkles, Download, UserPlus, Building2, User } from "lucide-react";
import Logo from "@/components/Logo";
import VideoIntro from "@/components/landing/VideoIntro";
import SigningShowcase from "@/components/landing/SigningShowcase";
import StatsBand from "@/components/landing/StatsBand";
import OtpStep from "@/components/landing/OtpStep";
import PasswordResetForm from "@/components/landing/PasswordResetForm";
import { trackVisit } from "@/lib/trackVisit";
import { base44 } from "@/api/base44Client";
import GoogleIcon from "@/components/GoogleIcon";

const PATTERN_IMG = "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/f202a53a2_generated_image.png";

export default function Landing() {
  const { t, lang, setLang, languages } = useI18n();
  const { login, loginWithGoogle, verifyOtp, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [otpPending, setOtpPending] = useState(null); // pendingId while awaiting the emailed code
  const [otpAccounts, setOtpAccounts] = useState([]); // all accounts this email+password unlocks
  const [loginKind, setLoginKind] = useState("company"); // 'company' | 'individual' — smart routing to the right account
  const [resetOpen, setResetOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const currentLang = languages.find((l) => l.code === lang);

  useEffect(() => {
    if (session) navigate("/app");
  }, [session, navigate]);

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("google_login")) return;
    const savedKind = sessionStorage.getItem("powercare_login_kind") || "company";
    sessionStorage.removeItem("powercare_login_kind");
    setSubmitting(true);
    loginWithGoogle(savedKind).then((company) => {
      if (!company) setError(t("errNoGoogleCompany"));
    }).finally(() => setSubmitting(false));
  }, []);

  const handleSocialLogin = (provider) => {
    sessionStorage.setItem("powercare_login_kind", loginKind);
    base44.auth.loginWithProvider(provider, "/?google_login=1");
  };

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

  // Strict account routing: keep only the accounts matching the chosen tab
  // (individual vs company). If the email has accounts but none of the chosen
  // kind, the login is refused with a clear message instead of silently
  // entering the wrong workspace.
  const routeAccounts = (accounts) => {
    return (accounts || []).filter((a) => (String(a.plan || "").toLowerCase() === "individual") === (loginKind === "individual"));
  };

  const wrongKindError = () =>
    loginKind === "company"
      ? (lang === "ar" ? "هذا البريد مسجل كحساب فردي — استخدم تبويب دخول الأفراد" : "This email is registered as an individual account — use the Individual Login tab")
      : (lang === "ar" ? "هذا البريد مسجل كحساب شركة فقط. يمكنك إنشاء حساب أفراد مجاني بنفس البريد من زر «تسجيل الأفراد — مجانًا» بالأسفل" : "This email only has a company account. You can create a free individual account with the same email using the “Individual sign-up — Free” button below");

  const handleCompanyLogin = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const r = await login(email, password, loginKind);
    if (!r) setError(t("errBadCredentials"));
    else if (r.wrongKind) setError(wrongKindError());
    else if (r.otpRequired) {
      const routed = routeAccounts(r.accounts);
      if ((r.accounts || []).length > 0 && routed.length === 0) {
        setError(wrongKindError());
      } else {
        setOtpPending(r.pendingId);
        setOtpAccounts(routed.length ? routed : r.accounts || []);
      }
    }
    setSubmitting(false);
    // r.company → session set, useEffect above redirects to /app
  };

  const handleVerifyOtp = async (code, chooseCompanyId) => {
    const c = await verifyOtp(otpPending, code, password, chooseCompanyId);
    return !!c;
  };

  const handleResendOtp = async () => {
    const result = await login(email, password, loginKind);
    if (!result?.otpRequired) return false;
    const routed = routeAccounts(result.accounts);
    setOtpPending(result.pendingId);
    setOtpAccounts(routed);
    return true;
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
            <span>{currentLang?.flag} {currentLang?.label}</span>
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
                  <span>{l.flag} {l.label}</span>
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

            <p className="mx-auto mt-5 max-w-lg text-base font-body leading-relaxed text-[#3a2f22]/65 lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="mx-auto mt-8 max-w-lg lg:mx-0">
              <img
                src="https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/0c8f66d08_generated_image.png"
                alt={lang === "ar" ? "لوحة تحكم PowerCare" : "PowerCare dashboard"}
                className="w-full drop-shadow-2xl"
                loading="lazy"
              />
            </div>

            <div className="mx-auto mt-8 max-w-lg divide-y divide-[#3a2f22]/8 overflow-hidden rounded-2xl border border-landing-gold/15 bg-white shadow-sm lg:mx-0 lg:mt-10">
              <FeatureBullet icon={Clock} title={t("feature1")} />
              <FeatureBullet icon={TrendingUp} title={t("feature2")} />
              <FeatureBullet icon={ShieldCheck} title={t("feature3")} />
            </div>
          </div>

          {/* Login card */}
          <div className="rounded-2xl border border-landing-gold/15 bg-white p-5 shadow-xl shadow-[#3a2f22]/10 sm:p-7">
            <div className="flex items-center gap-1 mb-6 bg-landing-bg rounded-full p-1">
              {[
                { key: "company", icon: Building2, ar: "دخول الشركات", en: "Company Login" },
                { key: "individual", icon: User, ar: "دخول الأفراد", en: "Individual Login" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setLoginKind(tab.key); setError(""); setOtpPending(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-body font-medium transition-colors ${
                    loginKind === tab.key
                      ? "bg-gradient-to-b from-landing-gold-light to-landing-gold text-white shadow-sm"
                      : "text-[#3a2f22]/60 hover:text-[#3a2f22]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" strokeWidth={1.75} />
                  {lang === "ar" ? tab.ar : tab.en}
                </button>
              ))}
            </div>

              {otpPending ? (
                <OtpStep key={loginKind} email={email} accounts={otpAccounts} onVerify={handleVerifyOtp} onResend={handleResendOtp} onBack={() => setOtpPending(null)} />
              ) : resetOpen ? (
                <PasswordResetForm initialEmail={email} onDone={(value) => { setEmail(value); setResetOpen(false); setError(""); }} onBack={() => setResetOpen(false)} />
              ) : (
              <div className="space-y-4">
                <button type="button" onClick={() => handleSocialLogin("sso")} disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-lg border border-landing-gold/25 py-3 text-sm font-semibold text-[#3a2f22] hover:bg-landing-bg disabled:opacity-50">
                  <GoogleIcon className="h-5 w-5" /> {t("continueWithGoogle")}
                </button>
                <div className="flex items-center gap-3 text-xs text-[#3a2f22]/40"><span className="h-px flex-1 bg-landing-gold/20" />{t("orDivider")}<span className="h-px flex-1 bg-landing-gold/20" /></div>
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
                  {t("forgotPasswordLink")}
                </button>
              </form>
              </div>
              )}
              <p className="mt-5 text-center text-sm font-body text-[#3a2f22]/55">
                {t("noAccountYet")}{" "}
                <Link to="/pricing" className="text-landing-gold font-semibold hover:underline">
                  {t("viewPlans")}
                </Link>
              </p>
              {loginKind === "individual" && (
                <Link
                  to="/pricing?signup=individual"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-landing-gold/30 bg-landing-bg py-2.5 text-sm font-body font-semibold text-[#3a2f22] hover:bg-landing-gold hover:text-white transition-colors"
                >
                  <UserPlus className="w-4 h-4" strokeWidth={1.75} />
                  {lang === "ar" ? "تسجيل الأفراد — مجانًا" : "Individual sign-up — Free"}
                </Link>
              )}
          </div>
        </div>
      </div>

      {/* Dark stats band — social proof */}
      <StatsBand lang={lang} />

      <VideoIntro />

      <GoldDivider />

      {/* Signing live demo — the verified e-signature flow sells itself */}
      <SigningShowcase />

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
            <Link to="/powercare-presentation" className="mt-4 inline-flex items-center gap-2 rounded-full border border-landing-gold/40 px-4 py-2 text-sm font-body font-semibold text-landing-gold transition-colors hover:bg-landing-gold hover:text-white">
              <Download className="h-3.5 w-3.5" />
              {t("downloadPresentation")}
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
            <ul className="space-y-2 text-sm font-body text-[#3a2f22]/55">
              <li>{t("footerBlog")}</li>
              <li><a href="/about" className="hover:text-landing-gold transition-colors">{t("footerAbout")}</a></li>
              <li><Link to="/security" className="hover:text-landing-gold transition-colors">{lang === "ar" ? "الأمان والامتثال" : "Security & Compliance"}</Link></li>
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