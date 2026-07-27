import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { activateCompanySession, createCompany, deleteCompany, syncCompanyAccount, getCompanyToken, updateCompanyPlan } from "@/lib/store";
import { useAuth as usePowerCareAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { Check, Loader2, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import SignupDialog from "@/components/pricing/SignupDialog";
import { DEFAULT_SUBSCRIPTION_PLANS, planDisplayName, planFeatures } from "@/lib/subscriptionPlans";

export default function Pricing() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { session, company } = usePowerCareAuth();
  const ownerUpgrade = session?.role === "owner" && !!company;
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [googleEmail, setGoogleEmail] = useState("");
  const pendingCompanyRef = useRef(null);
  const [plans, setPlans] = useState(DEFAULT_SUBSCRIPTION_PLANS);

  useEffect(() => {
    base44.entities.SubscriptionPlan.list("sortOrder", 50).then((items) => {
      const active = items.filter((plan) => plan.active);
      if (active.length) setPlans(active);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const provider = params.has("apple_signup") ? "Apple" : params.has("microsoft_signup") ? "Microsoft" : params.has("google_signup") ? "Google" : null;
    if (!provider) return;
    const saved = JSON.parse(sessionStorage.getItem("powercare_social_signup") || "null");
    sessionStorage.removeItem("powercare_social_signup");
    if (!saved) return;
    setBilling(saved.billing || "monthly");
    setActivePlan(plans.find((plan) => plan.slug === saved.planId) || null);
    base44.auth.me().then((user) => setGoogleEmail(user.email || "")).catch(() => setError(lang === "ar" ? `تعذر التسجيل باستخدام ${provider}.` : `${provider} sign-up could not be completed.`));
  }, []);

  const saveSocialSignup = () => sessionStorage.setItem("powercare_social_signup", JSON.stringify({ planId: activePlan.slug, billing }));
  const handleGoogleSignup = () => {
    saveSocialSignup();
    base44.auth.loginWithProvider("sso", "/pricing?google_signup=1");
  };
  const handleMicrosoftSignup = () => {
    saveSocialSignup();
    base44.auth.loginWithProvider("microsoft", "/pricing?microsoft_signup=1");
  };
  const handleAppleSignup = () => {
    saveSocialSignup();
    base44.auth.loginWithProvider("apple", "/pricing?apple_signup=1");
  };

  const handleTrialSignup = async ({ companyName, ownerEmail, ownerPassword, authMethod, pendingId, otpCode }) => {
    setError("");
    if (!pendingId) {
      try {
        const response = await base44.functions.invoke("companyDirectory", { action: "startSignupOtp", email: ownerEmail, plan: activePlan.slug });
        return response.data;
      } catch (error) {
        setError(error?.response?.data?.error === "email_exists" ? (lang === "ar" ? "هذا البريد مسجل مسبقًا." : "This email is already registered.") : (lang === "ar" ? "تعذر إرسال رمز التحقق." : "Could not send the verification code."));
        return false;
      }
    }
    const activationDate = new Date().toISOString().slice(0, 10);
    const company = pendingCompanyRef.current || createCompany(
      { name: companyName, ownerEmail, ownerPassword: authMethod === "google" ? crypto.randomUUID() + crypto.randomUUID() : ownerPassword, plan: activePlan.nameEn, subscriptionStart: activationDate, subscriptionEnd: null },
      { sync: false }
    );
    pendingCompanyRef.current = company;
    const saved = await syncCompanyAccount(company, { pendingId, code: otpCode });
    if (saved !== true) {
      pendingCompanyRef.current = null;
      deleteCompany(company.id);
      setError(saved === "email_exists"
        ? (lang === "ar" ? "لديك حساب من نفس النوع مسجّل بهذا البريد — يرجى تسجيل الدخول بدلًا من إنشاء حساب جديد." : "This email already has an account of this type — please sign in instead of creating a new one.")
        : ["invalid_code", "invalid_or_expired", "signup_otp_required"].includes(saved)
          ? (lang === "ar" ? "رمز التحقق غير صحيح أو منتهي الصلاحية." : "The verification code is invalid or expired.")
          : (lang === "ar" ? "تعذر حفظ حساب الشركة. يرجى المحاولة مرة أخرى." : "The company account could not be saved. Please try again."));
      return false;
    }
    pendingCompanyRef.current = null;
    activateCompanySession(company);
    base44.functions.invoke("subscriberEmails", { action: "welcome", companyId: company.id, sessionToken: getCompanyToken(company.id) }).catch(() => {});
    navigate("/app");
    return true;
  };

  const handleOwnerUpgrade = async (plan) => {
    if (!ownerUpgrade) return;
    setActivePlan(plan);
    setLoading(true);
    setError("");
    try {
      const planName = plan.nameEn;
      await updateCompanyPlan(company.id, planName, new Date().toISOString().slice(0, 10), null);
      navigate("/app");
    } catch (error) {
      setError(error?.message || (lang === "ar" ? "تعذرت ترقية الحساب. حاول مرة أخرى." : "Account upgrade failed. Please try again."));
    } finally { setLoading(false); }
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
        plan: activePlan.slug,
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
    <div className="powercare-public min-h-screen bg-landing-cinema px-6 py-12 text-white">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate("/")}
          className="mb-4 flex items-center gap-1.5 text-sm text-white/55 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("backBtn")}
        </button>
        <div className="flex items-center gap-2 justify-center mb-3">
          <Logo size={32} />
        </div>
        <h1 className="mb-3 text-center font-heading text-5xl font-semibold text-white md:text-6xl">{t("pricingHeading")}</h1>
        <p className="mb-12 text-center text-white/55">{t("pricingSubheading")}</p>

        {error && <p className="text-center text-sm text-red-500 font-body mb-6">{error}</p>}

        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex rounded-full border border-accent/35 bg-card p-1 text-sm text-card-foreground"><button onClick={() => setBilling("monthly")} className={`rounded-full px-4 py-2 ${billing === "monthly" ? "bg-accent text-accent-foreground" : ""}`}>{lang === "ar" ? "شهري" : "Monthly"}</button><button onClick={() => setBilling("yearly")} className={`rounded-full px-4 py-2 ${billing === "yearly" ? "bg-accent text-accent-foreground" : ""}`}>{lang === "ar" ? "سنوي" : "Yearly"}</button></div>
          <div className="w-fit rounded-full border border-accent/35 bg-accent/10 px-5 py-2 text-sm font-semibold text-accent shadow-sm">{lang === "ar" ? "عرض ترويجي: جميع الباقات مجانية حاليًا" : "Promotion: all plans are currently free"}</div>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <div key={plan.id || plan.slug} className="flex flex-col rounded-2xl border border-accent/20 bg-card p-6 text-card-foreground shadow-xl shadow-accent/5">
              <h3 className="mb-1 font-heading text-2xl text-primary">{planDisplayName(plan, lang)}</h3>
              <p className="font-heading text-3xl text-accent">{billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice} {plan.currency}</p>
              <p className="mb-3 text-xs text-muted-foreground">{billing === "yearly" ? (lang === "ar" ? "سنويًا" : "per year") : (lang === "ar" ? "شهريًا" : "per month")}</p>
              {plan.freeNow && <p className="mb-4 text-xs font-medium text-landing-gold">{lang === "ar" ? "متاحة مجانًا في الوقت الراهن" : "Available free for the time being"}</p>}
              <ul className="space-y-2 mb-6 flex-1">
                {planFeatures(plan, lang).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-landing-gold shrink-0 mt-0.5" strokeWidth={2} />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => ownerUpgrade ? handleOwnerUpgrade(plan) : setActivePlan(plan)}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                {loading && activePlan?.slug === plan.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : ownerUpgrade ? (lang === "ar" ? `ترقية إلى ${plan.nameAr}` : `Upgrade to ${plan.nameEn}`) : (lang === "ar" ? "ابدأ مجانًا" : "Start free")}
              </button>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-5 text-xs text-white/55"><Link to="/privacy" className="hover:text-accent">{lang === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}</Link><Link to="/terms" className="hover:text-accent">{lang === "ar" ? "الشروط والأحكام" : "Terms & Conditions"}</Link><Link to="/refund-policy" className="hover:text-accent">{lang === "ar" ? "سياسة الاسترجاع" : "Refund Policy"}</Link></div>
      </div>

      {activePlan && (
        <SignupDialog
          key={`${activePlan.id}-${googleEmail}`}
          plan={activePlan}
          onClose={() => { pendingCompanyRef.current = null; setActivePlan(null); setError(""); }}
          onSubmit={handleTrialSignup}
          onGoogle={handleGoogleSignup}
          onMicrosoft={handleMicrosoftSignup}
          onApple={handleAppleSignup}
          googleEmail={googleEmail}
          error={error}
        />
      )}
    </div>
  );
}