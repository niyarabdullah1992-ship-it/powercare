import React, { useEffect, useState } from "react";
import { CheckCircle2, MessageSquare, Send, Star, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";
import { getCompanyToken } from "@/lib/store";

export default function ProductFeedbackPrompt({ companyId, role }) {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const open = () => { setVisible(true); setSent(false); setError(""); };
    window.addEventListener("powercare:open-feedback", open);
    return () => window.removeEventListener("powercare:open-feedback", open);
  }, []);

  const submit = async () => {
    if (!rating || !message.trim() || saving) return;
    setSaving(true); setError("");
    try {
      await base44.functions.invoke("gmailNotify", { kind: "product_feedback", companyId, sessionToken: getCompanyToken(companyId), role, rating, message: message.trim(), page: window.location.pathname });
      setSent(true); setRating(0); setMessage("");
    } catch { setError(ar ? "تعذّر إرسال التقييم؛ حاول مرة أخرى." : "Couldn't send feedback; try again."); }
    finally { setSaving(false); }
  };

  return <>
    {!visible && <button onClick={() => setVisible(true)} className="fixed bottom-24 end-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-elevated md:bottom-6" aria-label={ar ? "التقييم والاقتراحات" : "Feedback and suggestions"}><MessageSquare className="h-5 w-5" /></button>}
    {visible && <aside className="fixed bottom-24 end-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-accent/25 bg-card p-5 shadow-elevated md:bottom-6" dir={ar ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-accent" /><div><h3 className="text-sm font-bold">{ar ? "قيّم تجربتك" : "Rate your experience"}</h3><p className="mt-0.5 text-xs text-muted-foreground">{ar ? "يصل تقييمك مباشرة إلى مالك المنصة" : "Your feedback goes directly to the platform owner"}</p></div></div><button onClick={() => setVisible(false)} className="rounded-lg p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
      {sent ? <div className="py-7 text-center"><CheckCircle2 className="mx-auto h-9 w-9 text-emerald-600" /><p className="mt-3 text-sm font-bold">{ar ? "شكراً، تم إرسال اقتراحك" : "Thank you, your suggestion was sent"}</p><button onClick={() => setVisible(false)} className="mt-4 text-xs font-semibold text-accent">{ar ? "إغلاق" : "Close"}</button></div> : <><div className="my-4 flex justify-center gap-2" dir="ltr">{[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setRating(value)} className="p-1" aria-label={`${value}/5`}><Star className={`h-7 w-7 ${value <= rating ? "fill-accent text-accent" : "text-border"}`} /></button>)}</div><textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 1000))} placeholder={ar ? "اكتب اقتراحك أو ملاحظتك…" : "Write your suggestion or feedback…"} rows={4} className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />{error && <p className="mt-2 text-xs text-destructive">{error}</p>}<button onClick={submit} disabled={!rating || !message.trim() || saving} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-40"><Send className="h-4 w-4" />{saving ? (ar ? "جارٍ الإرسال…" : "Sending…") : (ar ? "إرسال للمالك" : "Send to owner")}</button></>}
    </aside>}
  </>;
}