import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { activateCompanySession, createCompany, deleteCompany, syncCompanyAccount, getCompanyToken, updateCompanyPlan } from "@/lib/store";
import { useAuth as usePowerCareAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import SignupDialog from "@/components/pricing/SignupDialog";

export default function Pricing() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { session, company } = usePowerCareAuth();
  const renewal = new URLSearchParams(window.location.search).has("expired") && !!session && !!company;
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [googleEmail, setGoogleEmail] = useState("");
  const pendingCompanyRef = useRef(null);

  const PLANS = [
    { id: "free", nameKey: "plan_free", price: 0, features: [t("freeF1"), t("freeF2"), t("freeF3")] },
    { id: "starter", nameKey: "plan_starter", price: 49, features: [t("starterF1"), t("starterF2"), t("starterF3")] },
    { id: "professional", nameKey: "plan_pro", price: 149, features: [t("proF1"), t("proF2"), t("proF3"), t("proF4")] },
    { id: "enterprise", nameKey: "plan_ent", price: 249, features: [t("entF1"), t("entF2"), t("entF3")] },
  ];

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("google_signup")) return;
    const saved = JSON.parse(sessionStorage.getItem("powercare_google_signup") || "null");
    sessionStorage.removeItem("powercare_google_signup");
    if (!saved) return;
    setBilling(saved.billing || "monthly");
    setActivePlan(PLANS.find((plan) => plan.id === saved.planId) || null);
    base44.auth.me().then((user) => setGoogleEmail(user.email || "")).catch(() => setError(lang === "ar" ? "تعذر تسجيل Google." : "Google sign-up could not be completed."));
  }, []);

  const handleGoogleSignup = () => {
    sessionStorage.setItem("powercare_google_signup", JSON.stringify({ planId: activePlan.id, billing }));
    // Google sign-in goes through the app's configured SSO provider —
    // direct "google" social login is disabled when a custom SSO is set.
    base44.auth.loginWithProvider("sso", "/pricing?google_signup=1");
  };

  const handleTrialSignup = async ({ companyName, ownerEmail, ownerPassword, authMethod }) => {
    setError("");
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setMonth(trialEnd.getMonth() + 3);
    const company = pendingCompanyRef.current || createCompany(
      { name: companyName, ownerEmail, ownerPassword: authMethod === "google" ? crypto.randomUUID() + crypto.randomUUID() : ownerPassword, plan: activePlan.id === "free" ? "Free" : (activePlan.id === "professional" ? "Professional" : activePlan.id === "enterprise" ? "Enterprise" : "Starter"), subscriptionStart: trialStart.toISOString().slice(0, 10), subscriptionEnd: trialEnd.toISOString().slice(0, 10) },
      { sync: false }
    );
    pendingCompanyRef.current = company;
    const saved = await syncCompanyAccount(company);
    if (saved !== true) {
      pendingCompanyRef.current = null;
      deleteCompany(company.id);
      setError(saved === "email_exists"
        ? (lang === "ar" ? "لديك حساب من نفس النوع مسجّل بهذا البريد — يرجى تسجيل الدخول بدلًا من إنشاء حساب جديد." : "This email already has an account of this type — please sign in instead of creating a new one.")
        : (lang === "ar" ? "تعذر حفظ حساب الشركة. يرجى المحاولة مرة أخرى." : "The company account could not be saved. Please try again."));
      return false;
    }
    pendingCompanyRef.current = null;
    activateCompanySession(company);
    base44.functions.invoke("subscriberEmails", { action: "welcome", companyId: company.id, sessionToken: getCompanyToken(company.id) }).catch(() => {});
    navigate("/app");
    return true;
  };

  const handleRenewal = async (plan) => {
    setActivePlan(plan);
    if (plan.id === "free") {
      await updateCompanyPlan(company.id, "Free", new Date().toISOString().slice(0, 10), null);
      navigate("/app");
      return;
    }
    if (window.self !== window.top) { setError(t("checkoutIframeError")); return; }
    setLoading(true); setError("");
    try {
      const res = await base44.functions.invoke("stripeCheckout", { action: "createSession", plan: plan.id, billing, companyId: company.id, sessionToken: getCompanyToken(company.id), returnUrl: window.location.origin });
      if (res.data?.url) window.location.href = res.data.url;
      else setError(res.data?.error || t("checkoutGenericError"));
    } catch { setError(t("checkoutGenericError")); }
    finally { setLoading(false); }
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
      setError(e?.response?.data?.error === "email_exists"
        ? (lang === "ar" ? "لديك حساب شركة مسجّل بهذا البريد — يرجى تسجيل الدخول بدلًا من إنشاء حساب جديد." : "This email already has a company account — please sign in instead of creating a new one.")
        : t("checkoutGenericError"));
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

        <div className="mx-auto mb-10 w-fit rounded-full border border-landing-gold/25 bg-white px-5 py-2 text-sm font-semibold text-landing-gold shadow-sm">
          {lang === "ar" ? "جميع الخطط مجانية في الوقت الراهن" : "All plans are currently free"}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-2xl text-[#3a2f22] mb-1">{t(plan.nameKey)}</h3>
              <p className="font-heading text-3xl text-landing-gold mb-1">
                {lang === "ar" ? "مجاني حاليًا" : "Free for now"}
              </p>
              <p className="text-xs text-landing-gold font-body font-medium mb-4">{lang === "ar" ? "متاحة مجانًا في الوقت الراهن" : "Available free for the time being"}</p>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#3a2f22]/70 font-body">
                    <Check className="w-4 h-4 text-landing-gold shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => renewal ? handleRenewal(plan) : setActivePlan(plan)}
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && activePlan?.id === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (lang === "ar" ? "ابدأ مجانًا" : "Start free")}
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
          onSubmit={handleTrialSignup}
          onGoogle={handleGoogleSignup}
          googleEmail={googleEmail}
          error={error}
        />
      )}
    </div>
  );
}