import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { MailCheck, Loader2 } from "lucide-react";

// Second login step: the user types the 6-digit code that was emailed to them.
export default function OtpStep({ email, onVerify, onBack }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const ok = await onVerify(code.trim());
    setLoading(false);
    if (!ok) setError(ar ? "الرمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired code");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center text-center gap-2">
        <span className="w-11 h-11 rounded-full bg-landing-bg flex items-center justify-center text-landing-gold">
          <MailCheck className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-body text-[#3a2f22]/70">
          {ar ? "أرسلنا رمز تحقق مكوّنًا من 6 أرقام إلى" : "We sent a 6-digit verification code to"}
        </p>
        <p className="text-sm font-body font-semibold text-[#3a2f22]" dir="ltr">{email}</p>
      </div>
      <input
        type="text"
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="••••••"
        autoFocus
        dir="ltr"
        className="w-full px-3 py-3 rounded-lg border border-transparent bg-landing-bg text-[#3a2f22] font-body text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-landing-gold"
      />
      {error && <p className="text-sm text-red-500 font-body text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full py-3 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white font-body text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {ar ? "تحقق ودخول" : "Verify & Sign In"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-center text-xs font-body text-[#3a2f22]/50 hover:text-[#3a2f22]"
      >
        {ar ? "رجوع" : "Back"}
      </button>
    </form>
  );
}