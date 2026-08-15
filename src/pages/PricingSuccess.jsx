import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { activateCompanySession, createCompany, syncCompanyAccount, getCompanyToken, updateCompanyPlan } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Logo from "@/components/Logo";

const PLAN_LABELS = { starter: "Starter", professional: "Professional", enterprise: "Enterprise", Free: "Free", Starter: "Starter", Professional: "Professional", Enterprise: "Enterprise" };

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
    const sessionId = new URLSearchParams(window.location.search).get("tap_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }
    base44.functions
      .invoke("tapPayments", { action: "verifyCharge", chargeId: sessionId })
      .then((res) => {
        if (res.data?.paid) {
          if (res.data.renewal && res.data.companyId) {
            updateCompanyPlan(res.data.companyId, PLAN_LABELS[res.data.plan] || "Starter", new Date().toISOString().slice(0, 10), null).then(() => navigate("/app"));
            return;
          }
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
      ownerPassword: session.authMethod === "google" ? crypto.randomUUID() + crypto.randomUUID() : password,
      plan: PLAN_LABELS[session.plan] || "Starter",
      orgType: "company",
    }, { sync: false });
    pendingCompanyRef.current = company;
    const saved = await syncCompanyAccount(company);
    if (!saved) {
      setSetupError(t("checkoutGenericError"));
      setSubmitting(false);
      return;
    }
    pendingCompanyRef.current = null;
    activateCompanySession(company);
    base44.functions.invoke("subscriberEmails", { action: "welcome", companyId: company.id, sessionToken: getCompanyToken(company.id) }).catch(() => {});
    base44.functions.invoke("subscriberEmails", { action: "paymentConfirmed", companyId: company.id, sessionToken: getCompanyToken(company.id) }).catch(() => {});
    setStatus("success");
    setSubmitting(false);
    setTimeout(() => navigate("/app"), 1500);
  };

  return (
    <div className="powercare-public flex min-h-screen items-center justify-center bg-[var(--nv-soft)] px-6">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-[var(--nv-line)] bg-[var(--nv-card)] p-8 text-center shadow-[0_8px_24px_rgba(20,40,75,.06)]">
        <div className="flex justify-center"><Logo size={40} /></div>

        {status === "verifying" && (
          <>
            <Loader2 className="w-8 h-8 text-[var(--nv-accent)] mx-auto animate-spin" />
            <p className="text-sm text-[var(--nv-muted)] font-body">{t("confirmingPayment")}</p>
          </>
        )}

        {status === "password" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-[var(--nv-muted)] font-body">{t("paymentConfirmedText")}</p>
            <form onSubmit={finishSetup} className="space-y-3 text-start">
              {session.authMethod !== "google" && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("choosePasswordPlaceholder")}
                  minLength={6}
                  required
                  className="w-full px-3 py-2.5 rounded-[9px] border border-[var(--nv-line)] bg-[var(--nv-card)] text-[var(--nv-ink)] text-sm font-body focus:outline-none focus:ring-2 focus:ring-[var(--nv-navy)]"
                />
              )}
              {setupError && <p className="text-xs text-red-500 font-body">{setupError}</p>}
              <button disabled={submitting} type="submit" className="w-full rounded-[9px] bg-[var(--nv-accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {submitting ? t("pleaseWaitBtn") : t("finishSetupBtn")}
              </button>
            </form>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="text-sm text-[var(--nv-muted)] font-body">{t("accountReadyText")}</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm text-[var(--nv-muted)] font-body">{t("paymentNotConfirmedText")}</p>
            <button onClick={() => navigate("/pricing")} className="w-full py-2.5 rounded-[9px] bg-[var(--nv-accent)] text-white text-sm font-semibold">
              {t("backToPricingBtn")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}