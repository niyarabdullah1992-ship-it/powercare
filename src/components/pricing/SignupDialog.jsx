import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import GoogleIcon from "@/components/GoogleIcon";
import SignupOtpStep from "@/components/pricing/SignupOtpStep";

export default function SignupDialog({ plan, onClose, onSubmit, onGoogle, googleEmail, error }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(googleEmail || "");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const isTrial = true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await onSubmit({ companyName, ownerEmail, ownerPassword, authMethod: googleEmail ? "google" : "password", pendingId, otpCode });
    if (result?.otpRequired) setPendingId(result.pendingId);
    setSubmitting(false);
  };

  const resendOtp = async () => {
    setSubmitting(true);
    const result = await onSubmit({ companyName, ownerEmail, ownerPassword, authMethod: googleEmail ? "google" : "password" });
    if (result?.otpRequired) { setPendingId(result.pendingId); setOtpCode(""); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full relative">
        <button onClick={onClose} className="absolute top-4 end-4 text-[#3a2f22]/40 hover:text-[#3a2f22]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-heading text-xl text-[#3a2f22] mb-1">{plan.name || t(plan.nameKey)}</h3>
        <p className="text-sm text-[#3a2f22]/55 font-body mb-5">
          {lang === "ar" ? "فعّل الباقة المختارة مجانًا الآن دون دفع أو تاريخ انتهاء." : "Activate the selected plan free now, with no payment or expiry date."}
        </p>
        {!googleEmail && (
          <>
            <button type="button" onClick={onGoogle} className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-landing-gold/25 py-2.5 text-sm font-semibold text-[#3a2f22] hover:bg-landing-bg">
              <GoogleIcon className="h-5 w-5" /> {lang === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}
            </button>
            <div className="mb-3 flex items-center gap-3 text-xs text-[#3a2f22]/40"><span className="h-px flex-1 bg-landing-gold/20" />{lang === "ar" ? "أو" : "or"}<span className="h-px flex-1 bg-landing-gold/20" /></div>
          </>
        )}
        {pendingId ? <SignupOtpStep email={ownerEmail} code={otpCode} setCode={setOtpCode} loading={submitting} error={error} onVerify={handleSubmit} onResend={resendOtp} ar={lang === "ar"} /> : <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t("companyNamePlaceholder")}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
          />
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            disabled={!!googleEmail}
            placeholder={t("emailPlaceholder")}
            required
            className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
          />
          {isTrial && !googleEmail && (
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              minLength={6}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-landing-bg text-[#3a2f22] text-sm font-body focus:outline-none focus:ring-2 focus:ring-landing-gold"
            />
          )}
          {error && <p className="text-xs text-red-500 font-body">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? t("pleaseWaitBtn") : (lang === "ar" ? "تفعيل الباقة مجانًا" : "Activate plan free")}
          </button>
        </form>}
        {!pendingId && <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 w-full text-center text-sm font-body text-[#3a2f22]/60 hover:text-[#3a2f22]"
        >
          {lang === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
          <span className="font-semibold text-landing-gold underline underline-offset-4">
            {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
          </span>
        </button>}
      </div>
    </div>
  );
}