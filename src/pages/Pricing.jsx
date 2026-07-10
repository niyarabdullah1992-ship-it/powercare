import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createCompany } from "@/lib/store";
import { Check, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import SignupDialog from "@/components/pricing/SignupDialog";

const PLANS = [
  { id: "free", name: "Free", price: 0, features: ["1 Station", "Up to 5 Employees", "Basic Task Tracking"] },
  { id: "starter", name: "Starter", price: 49, features: ["Up to 5 Stations", "Up to 30 Employees", "Reports & Safety Tools"] },
  { id: "professional", name: "Professional", price: 149, features: ["Unlimited Stations", "Unlimited Employees", "Full HR Suite", "Schedules & Analytics"] },
  { id: "enterprise", name: "Enterprise", price: 249, features: ["Everything in Professional", "Priority Support", "Custom Onboarding"] },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFreeSignup = ({ companyName, ownerEmail, ownerPassword }) => {
    const company = createCompany({ name: companyName, ownerEmail, ownerPassword, plan: "Starter" });
    navigate("/");
    return company;
  };

  const handlePaidSignup = async ({ companyName, ownerEmail }) => {
    if (window.self !== window.top) {
      setError("Checkout only works from a published app, not inside the editor preview.");
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
        setError(res.data?.error || "Could not start checkout.");
      }
    } catch (e) {
      setError("Could not start checkout. Please try again.");
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
        <h1 className="hero-title text-landing-gold text-5xl md:text-6xl text-center mb-3">Pricing</h1>
        <p className="text-center text-[#3a2f22]/55 font-body mb-12">Choose the plan that fits your operation.</p>

        {error && <p className="text-center text-sm text-red-500 font-body mb-6">{error}</p>}

        <div className="grid md:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div key={plan.id} className="bg-white rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="font-heading text-2xl text-[#3a2f22] mb-1">{plan.name}</h3>
              <p className="font-heading text-3xl text-landing-gold mb-4">
                {plan.price === 0 ? "Free" : `$${plan.price}`}
                {plan.price > 0 && <span className="text-sm text-[#3a2f22]/40 font-body">/mo</span>}
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
                {loading && activePlan?.id === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (plan.price === 0 ? "Start Free" : "Subscribe")}
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