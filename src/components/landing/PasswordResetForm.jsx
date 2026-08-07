import React, { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { requestPasswordReset, resetPassword } from "@/lib/store";
import { base44 } from "@/api/base44Client";
import GoogleIcon from "@/components/GoogleIcon";

export default function PasswordResetForm({ initialEmail, onDone, onBack }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [email, setEmail] = useState(initialEmail || "");
  const [pendingId, setPendingId] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!pendingId && !email.trim()) {
      setError(ar ? "أدخل البريد الإلكتروني" : "Enter your email");
      return;
    }
    if (pendingId && code.length !== 6) {
      setError(ar ? "أدخل رمز التحقق المكوّن من 6 أرقام" : "Enter the 6-digit verification code");
      return;
    }
    if (pendingId && password.length < 6) {
      setError(ar ? "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" : "Use at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      if (!pendingId) {
        const id = await requestPasswordReset(email.trim());
        if (id) setPendingId(id); else setError(ar ? "تعذّر إرسال الرمز" : "Could not send the code");
      } else if (await resetPassword(pendingId, code, password, email.trim())) onDone(email.trim());
      else setError(ar ? "تعذّر التغيير؛ اطلب رمزًا جديدًا وحاول مرة أخرى" : "Reset failed; request a new code and try again");
    } catch {
      setError(ar ? "تعذّر إرسال الرمز؛ استخدم الدخول عبر Google" : "The code could not be sent; continue with Google");
    } finally {
      setLoading(false);
    }
  };
  return <form onSubmit={submit} noValidate className="space-y-4">
    <div className="text-center"><MailCheck className="mx-auto h-6 w-6 text-landing-gold" /><p className="mt-2 text-sm text-primary/70">{pendingId ? (ar ? "أدخل الرمز المرسل وكلمة المرور الجديدة" : "Enter the emailed code and a new password") : (ar ? "سنرسل رمز استعادة إلى بريدك" : "We'll email you a recovery code")}</p></div>
    {!pendingId ? <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email"} className="w-full rounded-lg bg-landing-bg px-3 py-3 text-primary outline-none focus:ring-2 focus:ring-landing-gold" /> : <>
      <input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" dir="ltr" className="w-full rounded-lg bg-landing-bg px-3 py-3 text-center text-xl tracking-[0.5em] text-primary outline-none focus:ring-2 focus:ring-landing-gold" />
      <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? "كلمة مرور جديدة" : "New password"} className="w-full rounded-lg bg-landing-bg px-3 py-3 text-primary outline-none focus:ring-2 focus:ring-landing-gold" />
    </>}
    {error && <p className="text-center text-sm text-destructive">{error}</p>}
    {!pendingId && (
      <button type="button" onClick={() => base44.auth.loginWithProvider("sso", "/?google_login=1")} className="flex w-full items-center justify-center gap-2 rounded-lg border border-landing-gold/30 py-3 text-sm font-semibold text-primary hover:bg-landing-bg">
        <GoogleIcon className="h-5 w-5" /> {ar ? "الدخول باستخدام Google" : "Continue with Google"}
      </button>
    )}
    <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-landing-gold py-3 text-sm font-semibold text-white disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{pendingId ? (ar ? "تعيين كلمة المرور" : "Set new password") : (ar ? "إرسال الرمز" : "Send code")}</button>
    <button type="button" onClick={onBack} className="w-full text-center text-xs text-primary/60 hover:text-primary">{ar ? "رجوع" : "Back"}</button>
  </form>;
}