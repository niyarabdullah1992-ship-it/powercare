import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createCompany, syncCompanyAccount } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

const PLAN_LABELS = { starter: "Starter", professional: "Professional", enterprise: "Enterprise" };

export default function PricingSuccess() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | password | success | error
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState("");
  const pendingCompanyRef = useRef(null);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }
    base44.functions
      .invoke("stripeCheckout", { action: "verifySession", sessionId })
      .then((res) => {
        if (res.data?.paid) {
          setSession(res.data);
          setStatus("password");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  const finishSetup = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSetupError("");
    const company = pendingCompanyRef.current || createCompany({
      name: session.companyName,
      ownerEmail: session.ownerEmail,
      ownerPassword: password,
      plan: PLAN_LABELS[session.plan] || "Starter",
    }, { sync: false });
    pendingCompanyRef.current = company;
    const saved = await syncCompanyAccount(company);
    if (!saved) {
      setSetupError(t("checkoutGenericError"));
      setSubmitting(false);
      return;
    }
    pendingCompanyRef.current = null;
    base44.functions.invoke("subscriberEmails", { action: "welcome", email: company.ownerEmail, companyName: company.name }).catch(() => {});
    base44.functions.invoke("subscriberEmails", { action: "paymentConfirmed", email: company.ownerEmail, companyName: company.name, plan: company.plan }).catch(() => {});
    setStatus("success");
    setSubmitting(false);
    setTimeout(() => navigate("/"), 1500);
  };

  return (
    <div className="min-h-screen bg-landing-bg flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl p-8 shadow-xl max-w-sm w-full text-center space-y-4">
        <div className="flex justify-center"><Logo size={40} /></div>

        {status === "verifying" && (
          <>
            <Loader2 className="w-8 h-8 text-landing-gold mx-auto animate-spin" />
            <p className="text-sm text-[#3a2f22]/60 font-body">{t("confirmingPayment")}</p>
          </>
        )}

        {status === "password" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-[#3a2f22]/60 font-body">{t("paymentConfirmedText")}</p>
            <form onSubmit={finishSetup} className="space-y-3 text-start">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("choosePasswordPlaceholder")}
                minLength={6}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
              />
              {setupError && <p className="text-xs text-red-500 font-body">{setupError}</p>}
              <button disabled={submitting} type="submit" className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? t("pleaseWaitBtn") : t("finishSetupBtn")}
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-[#3a2f22]/60 font-body">{t("accountReadyText")}</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm text-[#3a2f22]/60 font-body">{t("paymentNotConfirmedText")}</p>
            <button onClick={() => navigate("/pricing")} className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              {t("backToPricingBtn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}