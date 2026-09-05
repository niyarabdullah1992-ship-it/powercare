import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import GoogleIcon from "@/components/GoogleIcon";
import { AppleIcon, MicrosoftIcon } from "@/components/ProviderIcons";
import SignupOtpStep from "@/components/pricing/SignupOtpStep";
import { appsEnabledForPlan, suiteAppLabel } from "@/lib/suiteApps";
import { normalizePlanConfig } from "@/lib/subscriptionPlans";

export default function SignupDialog({ plan, isFree, onClose, onSubmit, onGoogle, onMicrosoft, onApple, googleEmail, error }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState(googleEmail || "");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const isTrial = isFree;
  const planNorm = normalizePlanConfig(plan);
  const enabledApps = appsEnabledForPlan(planNorm);
  const ar = lang === "ar";

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
    <div className="fixed inset-0 bg-[rgba(20,40,75,.38)] flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-[0_24px_60px_rgba(20,40,75,.22)] max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 end-4 text-[#5A6B85] hover:text-[#14284B]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-semibold text-[#14284B] mb-1">{lang === "ar" ? plan.nameAr : plan.nameEn}</h3>
        <p className="text-sm text-[#5A6B85] font-body mb-4">
          {isTrial ? (lang === "ar" ? "فعّل الباقة المختارة مجانًا الآن دون دفع أو تاريخ انتهاء." : "Activate the selected plan free now, with no payment or expiry date.") : (lang === "ar" ? "أكمل بيانات الشركة للانتقال إلى صفحة الدفع الآمنة عبر Tap Payments." : "Complete your company details to continue to secure payment with Tap Payments.")}
        </p>

        <div className="mb-4 rounded-[11px] border border-[#E2E8F0] bg-[#F7F8FA] p-3">
          <p className="text-xs font-semibold text-[#14284B] mb-2">
            {ar ? `التطبيقات المفعّلة (${enabledApps.length})` : `Apps included (${enabledApps.length})`}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {enabledApps.map((app) => (
              <span key={app.id} className="rounded-full border border-[#E2E8F0] bg-white px-2 py-0.5 text-[10px] text-[#5A6B85]">
                {suiteAppLabel(app, ar ? "ar" : "en")}
              </span>
            ))}
          </div>
        </div>

        {!googleEmail && (
          <>
            <button type="button" onClick={onGoogle} className="mb-2 flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#E2E8F0] py-2.5 text-sm font-semibold text-[#14284B] hover:bg-[#F7F8FA]">
              <GoogleIcon className="h-5 w-5" /> {lang === "ar" ? "المتابعة باستخدام Google" : "Continue with Google"}
            </button>
            <button type="button" onClick={onMicrosoft} className="mb-2 flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#E2E8F0] py-2.5 text-sm font-semibold text-[#14284B] hover:bg-[#F7F8FA]">
              <MicrosoftIcon className="h-5 w-5" /> {lang === "ar" ? "المتابعة باستخدام Microsoft" : "Continue with Microsoft"}
            </button>
            <button type="button" onClick={onApple} className="mb-3 flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#E2E8F0] py-2.5 text-sm font-semibold text-[#14284B] hover:bg-[#F7F8FA]">
              <AppleIcon className="h-5 w-5" /> {lang === "ar" ? "المتابعة باستخدام Apple" : "Continue with Apple"}
            </button>
            <div className="mb-3 flex items-center gap-3 text-xs text-[#5A6B85]"><span className="h-px flex-1 bg-[#E2E8F0]" />{lang === "ar" ? "أو" : "or"}<span className="h-px flex-1 bg-[#E2E8F0]" /></div>
          </>
        )}
        {pendingId ? <SignupOtpStep email={ownerEmail} code={otpCode} setCode={setOtpCode} loading={submitting} error={error} onVerify={handleSubmit} onResend={resendOtp} ar={lang === "ar"} /> : <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={t("companyNamePlaceholder")}
            required
            className="w-full px-3 py-2.5 rounded-[9px] border border-[#E2E8F0] bg-white text-[#14284B] text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#14284B]"
          />
          <input
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            disabled={!!googleEmail}
            placeholder={t("emailPlaceholder")}
            required
            className="w-full px-3 py-2.5 rounded-[9px] border border-[#E2E8F0] bg-white text-[#14284B] text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#14284B]"
          />
          {isTrial && !googleEmail && (
            <input
              type="password"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              minLength={6}
              required
              className="w-full px-3 py-2.5 rounded-[9px] border border-[#E2E8F0] bg-white text-[#14284B] text-sm font-body focus:outline-none focus:ring-2 focus:ring-[#14284B]"
            />
          )}
          {error && <p className="text-xs text-red-500 font-body">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-[9px] bg-[#1E9E63] text-white text-sm font-semibold disabled:opacity-50"
          >
            {submitting ? t("pleaseWaitBtn") : isTrial ? (lang === "ar" ? "تفعيل الباقة مجانًا" : "Activate plan free") : (lang === "ar" ? "المتابعة إلى Tap Payments" : "Continue to Tap Payments")}
          </button>
        </form>}
        {!pendingId && <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-4 w-full text-center text-sm font-body text-[#5A6B85] hover:text-[#14284B]"
        >
          {lang === "ar" ? "لديك حساب بالفعل؟ " : "Already have an account? "}
          <span className="font-semibold text-[#14284B] underline underline-offset-4">
            {lang === "ar" ? "تسجيل الدخول" : "Sign in"}
          </span>
        </button>}
      </div>
    </div>
  );
}
