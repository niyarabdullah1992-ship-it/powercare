import React, { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";

// Emails the client a private link to review the proof and sign it electronically.
export default function SendSignLinkDialog({ proof, ar, onClose, onSend }) {
  const [email, setEmail] = useState(proof.clientEmail || "");
  const [sending, setSending] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const submit = async () => {
    if (!valid || sending) return;
    setSending(true);
    await onSend({ clientEmail: email.trim(), origin: window.location.origin });
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-t-2xl border border-border bg-card shadow-elevated sm:rounded-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-primary-foreground">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60 font-body">{proof.proofNumber}</p>
            <h3 className="font-heading text-lg font-semibold">{ar ? "إرسال رابط التوقيع" : "Send signature link"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-primary-foreground/70 hover:bg-white/10" aria-label="close"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-3 p-5">
          <label className="block space-y-1.5">
            <span className="block text-xs font-medium text-muted-foreground font-body">{ar ? "بريد العميل" : "Client email"}</span>
            <input
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
              className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm font-body"
            />
          </label>
          <p className="text-[11px] leading-relaxed text-muted-foreground font-body">
            {ar
              ? "يصل العميل بريدًا يحتوي ملخص العمل ورابطًا خاصًا للتوقيع. بمجرد توقيعه تتحوّل الحالة إلى «موثّق بتوقيع العميل»."
              : "The client receives the work summary and a private signing link. Once signed, the record becomes client-sealed."}
          </p>
          {proof.signLinkSentAt && (
            <p className="text-[11px] text-accent-text font-body">
              {ar ? "آخر إرسال:" : "Last sent:"} {new Date(proof.signLinkSentAt).toLocaleString(ar ? "ar" : "en")}
            </p>
          )}
        </div>

        <div className="border-t border-border px-5 py-4 pb-safe">
          <button
            type="button"
            onClick={submit}
            disabled={!valid || sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground disabled:opacity-40"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {ar ? "إرسال البريد للعميل" : "Email the client"}
          </button>
        </div>
      </div>
    </div>
  );
}