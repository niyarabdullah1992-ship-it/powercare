import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { activateCompanySession, createCompany, syncCompanyAccount } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import SignupDialog from "@/components/pricing/SignupDialog";

export default function Pricing() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [audience, setAudience] = useState("company");
  const [googleEmail, setGoogleEmail] = useState("");
  const pendingCompanyRef = useRef(null);

  const PLANS = [
    { id: "free", nameKey: "plan_free", price: 0, features: [t("freeF1"), t("freeF2"), t("freeF3")] },
    { id: "starter", nameKey: "plan_starter", price: 49, features: [t("starterF1"), t("starterF2"), t("starterF3")] },
    { id: "professional", nameKey: "plan_pro", price: 149, features: [t("proF1"), t("proF2"), t("proF3"), t("proF4")] },
    { id: "enterprise", nameKey: "plan_ent", price: 249, features: [t("entF1"), t("entF2"), t("entF3")] },
  ];

  const INDIVIDUAL_PLANS = [
    {
      id: "individual",
      individual: true,
      name: lang === "ar" ? "فرد" : "Individual",
      price: 0,
      features: lang === "ar"
        ? ["مساحة عمل شخصية خاصة بك", "مهام يومية مع مجلدات وتنظيم", "المساعد الذكي Niro", "التوقيع الرقمي بشارة تحقق مشفّرة", "ملفاتك ومستنداتك الخاصة"]
        : ["Your own personal workspace", "Daily tasks with folders & organization", "Niro AI assistant", "Digital signing with encrypted verification", "Your private files & documents"],
    },
  ];

  const shownPlans = audience === "individual" ? INDIVIDUAL_PLANS : PLANS;

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("google_signup")) return;
    const saved = JSON.parse(sessionStorage.getItem("powercare_google_signup") || "null");
    sessionStorage.removeItem("powercare_google_signup");
    if (!saved) return;
    setBilling(saved.billing || "monthly");
    if (saved.planId === "individual") setAudience("individual");
    setActivePlan([...PLANS, ...INDIVIDUAL_PLANS].find((plan) => plan.id === saved.planId) || null);
    base44.auth.me().then((user) => setGoogleEmail(user.email || "")).catch(() => setError(lang === "ar" ? "تعذر تسجيل Google." : "Google sign-up could not be completed."));
  }, []);

  const handleGoogleSignup = () => {
    sessionStorage.setItem("powercare_google_signup", JSON.stringify({ planId: activePlan.id, billing }));
    base44.auth.loginWithProvider("google", "/pricing?google_signup=1");
  };

  const handleFreeSignup = async ({ companyName, ownerEmail, ownerPassword, authMethod }) => {
    setError("");
    const company = pendingCompanyRef.current || createCompany(
      { name: companyName, ownerEmail, ownerPassword: authMethod === "google" ? crypto.randomUUID() + crypto.randomUUID() : ownerPassword, plan: activePlan?.id === "individual" ? "Individual" : "Free" },
      { sync: false }
    );
    pendingCompanyRef.current = company;
    const saved = await syncCompanyAccount(company);
    if (!saved) {
      setError(lang === "ar" ? "تعذر حفظ حساب الشركة. يرجى المحاولة مرة أخرى." : "The company account could not be saved. Please try again.");
      return false;
    }
    pendingCompanyRef.current = null;
    activateCompanySession(company);
    base44.functions.invoke("subscriberEmails", { action: "welcome", email: company.ownerEmail, companyName: company.name }).catch(() => {});
    navigate("/app");
    return true;
  };

  const handlePaidSignup = async ({ companyName, ownerEmail, authMethod }) => {
    if (window.self !== window.top) {
      setError(t("checkoutIframeError"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        action: "createSession",
        plan: activePlan.id,
        billing,
        companyName,
        ownerEmail,
        authMethod,
        returnUrl: window.location.origin,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        setError(res.data?.error || t("checkoutGenericError"));
      }
    } catch (e) {
      setError(t("checkoutGenericError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-landing-bg px-6 py-12">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 text-sm font-body text-[#3a2f22]/60 hover:text-[#3a2f22] mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("backBtn")}
        </button>
        <div className="flex items-center gap-2 justify-center mb-3">
          <Logo size={32} />
        </div>
        <h1 className="hero-title text-landing-gold text-5xl md:text-6xl text-center mb-3">{t("pricingHeading")}</h1>
        <p className="text-center text-[#3a2f22]/55 font-body mb-12">{t("pricingSubheading")}</p>

        {error && <p className="text-center text-sm text-red-500 font-body mb-6">{error}</p>}

        {/* Audience toggle — companies vs. individuals */}
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
            {[
              { key: "company", ar: "🏢 للشركات", en: "🏢 For Companies" },
              { key: "individual", ar: "👤 للأفراد", en: "👤 For Individuals" },
            ].map((a) => (
              <button
                key={a.key}
                onClick={() => setAudience(a.key)}
                className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-colors ${audience === a.key ? "bg-gradient-to-b from-landing-gold-light to-landing-gold text-white" : "text-[#3a2f22]/60 hover:text-[#3a2f22]"}`}
              >
                {lang === "ar" ? a.ar : a.en}
              </button>
            ))}
          </div>
        </div>

        {/* Billing interval toggle — yearly = 2 months free */}
        <div className={`items-center justify-center gap-2 mb-10 ${audience === "company" ? "flex" : "hidden"}`}>
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-colors ${billing === "monthly" ? "bg-gradient-to-b from-landing-gold-light to-landing-gold text-white" : "text-[#3a2f22]/60 hover:text-[#3a2f22]"}`}
            >
              {t("billMonthly")}
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-body font-medium transition-colors ${billing === "yearly" ? "bg-gradient-to-b from-landing-gold-light to-landing-gold text-white" : "text-[#3a2f22]/60 hover:text-[#3a2f22]"}`}
            >
              {t("billYearly")}
            </button>
          </div>
          <span className="px-3 py-1 rounded-full bg-landing-gold/15 text-landing-gold-deep text-xs font-body font-semibold">
            {t("yearlySavings")}
          </span>
        </div>

        <div className={audience === "individual" ? "grid max-w-sm mx-auto" : "grid md:grid-cols-4 gap-6"}>
          {shownPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-2xl text-[#3a2f22] mb-1">{plan.name || t(plan.nameKey)}</h3>
              <p className="font-heading text-3xl text-landing-gold mb-1">
                {plan.price === 0 ? t("plan_free") : (billing === "yearly" ? `$${plan.price * 10}` : `$${plan.price}`)}
                {plan.price > 0 && <span className="text-sm text-[#3a2f22]/40 font-body">{billing === "yearly" ? t("perYear") : t("perMonth")}</span>}
              </p>
              {plan.price > 0 && billing === "yearly" && (
                <p className="text-xs text-[#3a2f22]/45 font-body">${plan.price * 10 / 12 % 1 === 0 ? plan.price * 10 / 12 : (plan.price * 10 / 12).toFixed(2)}{t("perMonth")} · {t("billedYearlyNote")}</p>
              )}
              {plan.price > 0 && (
                <p className="text-xs text-landing-gold font-body font-medium mb-4">{t("trialBadge")}</p>
              )}
              {plan.price === 0 && <div className="mb-4" />}
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#3a2f22]/70 font-body">
                    <Check className="w-4 h-4 text-landing-gold shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setActivePlan(plan)}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && activePlan?.id === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (plan.price === 0 ? t("startFree") : t("startTrialBtn"))}
              </button>
            </div>
          ))}
        </div>
      </div>

      {activePlan && (
        <SignupDialog
          key={`${activePlan.id}-${googleEmail}`}
          plan={activePlan}
          onClose={() => { pendingCompanyRef.current = null; setActivePlan(null); setError(""); }}
          onSubmit={activePlan.price === 0 ? handleFreeSignup : handlePaidSignup}
          onGoogle={handleGoogleSignup}
          googleEmail={googleEmail}
          error={error}
        />
      )}
    </div>
  );
}