import React, { useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { requestOwnerPasswordReset, resetOwnerPassword } from "@/lib/store";

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
    e.preventDefault(); setLoading(true); setError("");
    if (!pendingId) {
      const id = await requestOwnerPasswordReset(email);
      if (id) setPendingId(id); else setError(ar ? "تعذّر إرسال الرمز" : "Could not send the code");
    } else if (password.length < 6) setError(ar ? "كلمة المرور 6 أحرف على الأقل" : "Use at least 6 characters");
    else if (await resetOwnerPassword(pendingId, code, password)) onDone(email);
    else setError(ar ? "الرمز غير صحيح أو منتهي الصلاحية" : "Invalid or expired code");
    setLoading(false);
  };
  return <form onSubmit={submit} className="space-y-4">
    <div className="text-center"><MailCheck className="mx-auto h-6 w-6 text-landing-gold" /><p className="mt-2 text-sm text-primary/70">{pendingId ? (ar ? "أدخل الرمز المرسل وكلمة المرور الجديدة" : "Enter the emailed code and a new password") : (ar ? "سنرسل رمز استعادة إلى بريدك" : "We'll email you a recovery code")}</p></div>
    {!pendingId ? <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={ar ? "البريد الإلكتروني" : "Email"} className="w-full rounded-lg bg-landing-bg px-3 py-3 text-primary outline-none focus:ring-2 focus:ring-landing-gold" /> : <>
      <input inputMode="numeric" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="••••••" dir="ltr" className="w-full rounded-lg bg-landing-bg px-3 py-3 text-center text-xl tracking-[0.5em] text-primary outline-none focus:ring-2 focus:ring-landing-gold" />
      <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={ar ? "كلمة مرور جديدة" : "New password"} className="w-full rounded-lg bg-landing-bg px-3 py-3 text-primary outline-none focus:ring-2 focus:ring-landing-gold" />
    </>}
    {error && <p className="text-center text-sm text-destructive">{error}</p>}
    <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-landing-gold py-3 text-sm font-semibold text-white disabled:opacity-50">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{pendingId ? (ar ? "تعيين كلمة المرور" : "Set new password") : (ar ? "إرسال الرمز" : "Send code")}</button>
    <button type="button" onClick={onBack} className="w-full text-center text-xs text-primary/60 hover:text-primary">{ar ? "رجوع" : "Back"}</button>
  </form>;
}