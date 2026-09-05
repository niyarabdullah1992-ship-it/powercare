import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MailCheck, Loader2, Building2, User, Check } from "lucide-react";

// Second login step: the user types the 6-digit code that was emailed to them.
// When one email owns several workspaces (company + individual), an account
// picker appears so the user chooses which one to enter.
export default function OtpStep({ email, accounts = [], onVerify, onResend, onBack }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [code, setCode] = useState("");
  const [chosenId, setChosenId] = useState(accounts[0]?.companyId || null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await onVerify(code.trim(), chosenId);
    setLoading(false);
    if (!ok) setError(ar ? "الرمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired code");
  };

  const handleResend = async () => {
    setError("");
    setNotice("");
    setResending(true);
    const ok = await onResend();
    setResending(false);
    if (ok) {
      setCode("");
      setNotice(ar ? "تم إرسال رمز جديد. استخدم أحدث رسالة فقط." : "A new code was sent. Use only the latest email.");
    } else {
      setError(ar ? "تعذّر إرسال رمز جديد" : "Could not send a new code");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="w-11 h-11 rounded-full bg-[#F7F8FA] flex items-center justify-center text-[#1E9E63]">
          <MailCheck className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-body text-[#5A6B85]">
          {ar ? "أرسلنا رمز تحقق مكوّنًا من 6 أرقام إلى" : "We sent a 6-digit verification code to"}
        </p>
        <p className="text-sm font-body font-semibold text-[#14284B]" dir="ltr">{email}</p>
      </div>
      {accounts.length > 1 && (
        <div className="space-y-2">
          <p className="text-xs font-body text-[#5A6B85] text-center">
            {ar ? "هذا البريد مرتبط بأكثر من حساب — اختر الحساب الذي تريد الدخول إليه:" : "This email has more than one account — choose which one to enter:"}
          </p>
          {accounts.map((a) => {
            const isIndividual = String(a.plan || "").toLowerCase() === "individual";
            const selected = chosenId === a.companyId;
            return (
              <button
                key={a.companyId}
                type="button"
                onClick={() => setChosenId(a.companyId)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-start transition-colors ${
                  selected ? "border-[#14284B] bg-[#F7F8FA]" : "border-[#E2E8F0] bg-white hover:border-[#14284B]"
                }`}
              >
                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#14284B] shrink-0 border border-[#E2E8F0]">
                  {isIndividual ? <User className="w-4 h-4" strokeWidth={1.75} /> : <Building2 className="w-4 h-4" strokeWidth={1.75} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-body font-semibold text-[#14284B] truncate">{a.name || a.companyId}</span>
                  <span className="block text-xs font-body text-[#5A6B85]">
                    {isIndividual ? (ar ? "حساب فردي" : "Individual account") : (ar ? `شركة — ${a.plan || ""}` : `Company — ${a.plan || ""}`)}
                  </span>
                </span>
                {selected && <Check className="w-4 h-4 text-[#1E9E63] shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
        autoFocus
        dir="ltr"
        className="w-full px-3 py-3 rounded-[9px] border border-[#E2E8F0] bg-white text-[#14284B] font-body text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#14284B]"
      />
      <p className="text-xs text-center text-[#5A6B85]">{ar ? "إذا طلبت الرمز أكثر من مرة، استخدم أحدث رمز وصلك فقط." : "If you requested more than one code, only the newest code will work."}</p>
      {notice && <p className="text-sm text-[#15803D] font-body text-center">{notice}</p>}
      {error && <p className="text-sm text-red-500 font-body text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-3 rounded-[9px] bg-[#1E9E63] text-white font-body text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {ar ? "تحقق ودخول" : "Verify & Sign In"}
      </button>
      <button
        type="button"
        onClick={handleResend}
        disabled={resending}
        className="w-full text-center text-sm font-semibold font-body text-[#14284B] underline underline-offset-4 disabled:opacity-50"
      >
        {resending ? (ar ? "جارٍ إرسال رمز جديد…" : "Sending a new code…") : (ar ? "إرسال رمز جديد" : "Send a new code")}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs font-body text-[#5A6B85] hover:text-[#14284B]"
      >
        {ar ? "رجوع" : "Back"}
      </button>
    </form>
  );
}