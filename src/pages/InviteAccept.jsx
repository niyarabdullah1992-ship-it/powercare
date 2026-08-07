import React, { useState } from "react";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { invitesApi } from "@/lib/jobCatalogApi";
import Logo from "@/components/Logo";

const ERRORS = {
  invalid_invite: "الدعوة غير صالحة أو ملغاة.",
  expired: "انتهت صلاحية الدعوة (7 أيام). اطلب دعوة جديدة من الموارد البشرية.",
  already_used: "سبق قبول هذه الدعوة — بانتظار اعتماد الموارد البشرية.",
  email_required: "البريد الإلكتروني مطلوب.",
};

// صفحة عامة: الموظف المدعو يضبط كلمة مروره — ولا يُفعَّل الحساب حتى يعتمده HR.
export default function InviteAccept() {
  const params = new URLSearchParams(window.location.search);
  const companyId = params.get("c") || "";
  const token = params.get("token") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) return setError("كلمة المرور يجب ألا تقل عن 6 أحرف.");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين.");
    setBusy(true);
    setError("");
    try {
      await invitesApi.accept(companyId, token, email, password);
      setDone(true);
    } catch (err) {
      setError(ERRORS[err?.response?.data?.error] || "تعذّر قبول الدعوة — حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="powercare-public min-h-screen flex items-center justify-center bg-landing-bg p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="flex flex-col items-center mb-5">
          <Logo size={56} />
          <h1 className="mt-3 font-heading text-2xl font-semibold">قبول دعوة الانضمام</h1>
        </div>
        {!companyId || !token ? (
          <p className="text-sm text-destructive text-center">رابط الدعوة غير مكتمل — استخدم الرابط المُرسل إليك كما هو.</p>
        ) : done ? (
          <div className="text-center space-y-3">
            <CheckCircle2 className="mx-auto h-10 w-10 text-accent" />
            <p className="font-medium">تم ضبط كلمة المرور بنجاح.</p>
            <p className="text-sm text-muted-foreground">حسابك الآن بانتظار اعتماد الموارد البشرية وربطه بمقعد وظيفي. ستتمكن من تسجيل الدخول فور الاعتماد.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">البريد الإلكتروني (لتسجيل الدخول) *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">كلمة المرور *</label>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">تأكيد كلمة المرور *</label>
              <input type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm" dir="ltr" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button type="submit" disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              قبول الدعوة وضبط كلمة المرور
            </button>
            <p className="text-[11px] text-muted-foreground text-center">لن يُفعَّل حسابك إلا بعد اعتماد الموارد البشرية وربطك بمقعد وظيفي.</p>
          </form>
        )}
      </div>
    </div>
  );
}