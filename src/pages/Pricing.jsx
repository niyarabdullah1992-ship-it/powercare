import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createCompany } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Check, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import SignupDialog from "@/components/pricing/SignupDialog";

export default function Pricing() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PLANS = [
    { id: "free", nameKey: "plan_free", price: 0, features: [t("freeF1"), t("freeF2"), t("freeF3")] },
    { id: "starter", nameKey: "plan_starter", price: 49, features: [t("starterF1"), t("starterF2"), t("starterF3")] },
    { id: "professional", nameKey: "plan_pro", price: 149, features: [t("proF1"), t("proF2"), t("proF3"), t("proF4")] },
    { id: "enterprise", nameKey: "plan_ent", price: 249, features: [t("entF1"), t("entF2"), t("entF3")] },
  ];

  const handleFreeSignup = ({ companyName, ownerEmail, ownerPassword }) => {
    const company = createCompany({ name: companyName, ownerEmail, ownerPassword, plan: "Starter" });
    navigate("/");
    return company;
  };

  const handlePaidSignup = async ({ companyName, ownerEmail }) => {
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
        companyName,
        ownerEmail,
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
        <div className="flex items-center gap-2 justify-center mb-3">
          <Logo size={32} />
        </div>
        <h1 className="hero-title text-landing-gold text-5xl md:text-6xl text-center mb-3">{t("pricingHeading")}</h1>
        <p className="text-center text-[#3a2f22]/55 font-body mb-12">{t("pricingSubheading")}</p>

        {error && <p className="text-center text-sm text-red-500 font-body mb-6">{error}</p>}

        <div className="grid md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-2xl text-[#3a2f22] mb-1">{t(plan.nameKey)}</h3>
              <p className="font-heading text-3xl text-landing-gold mb-4">
                {plan.price === 0 ? t("plan_free") : `$${plan.price}`}
                {plan.price > 0 && <span className="text-sm text-[#3a2f22]/40 font-body">{t("perMonth")}</span>}
              </p>
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
                {loading && activePlan?.id === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (plan.price === 0 ? t("startFree") : t("subscribe"))}
              </button>
            </div>
          ))}
        </div>
      </div>

      {activePlan && (
        <SignupDialog
          plan={activePlan}
          onClose={() => setActivePlan(null)}
          onSubmit={activePlan.price === 0 ? handleFreeSignup : handlePaidSignup}
        />
      )}
    </div>
  );
}