import React, { useEffect, useState } from "react";
import { MessageSquare, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useI18n } from "@/lib/i18n";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function ProductFeedbackPrompt({ companyId, role }) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const key = `powercare_feedback_${companyId}`;

  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem(key) || "null");
      if (!state) localStorage.setItem(key, JSON.stringify({ firstSeen: Date.now() }));
      else if (!state.completed && Date.now() - state.firstSeen >= WEEK_MS) setVisible(true);
    } catch {
      localStorage.setItem(key, JSON.stringify({ firstSeen: Date.now() }));
    }
  }, [key]);

  if (!visible) return null;
  const close = () => { localStorage.setItem(key, JSON.stringify({ completed: true })); setVisible(false); };
  const submit = async () => {
    if (!rating || saving) return;
    setSaving(true);
    setError("");
    try {
      await base44.entities.ProductFeedback.create({ companyId, role, rating, message: message.trim(), page: window.location.pathname });
      close();
    } catch {
      setError(t("aiError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="fixed bottom-20 end-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-border bg-card p-4 shadow-xl md:bottom-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2"><MessageSquare className="mt-0.5 h-4 w-4 text-accent" /><p className="text-sm font-medium">{t("feedbackQuestion")}</p></div>
        <button onClick={close} className="rounded-md p-1 hover:bg-muted" aria-label={t("cancel")}><X className="h-4 w-4" /></button>
      </div>
      <div className="my-3 flex gap-2" dir="ltr">{[1,2,3,4,5].map((value) => <button key={value} onClick={() => setRating(value)} className={`h-9 w-9 rounded-full border text-sm ${rating >= value ? "border-accent bg-accent text-accent-foreground" : "border-border"}`}>{value}</button>)}</div>
      <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t("feedbackPlaceholder")} rows={2} className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      <button onClick={submit} disabled={!rating || saving} className="mt-3 w-full rounded-md bg-foreground px-3 py-2 text-sm text-background disabled:opacity-50">{saving ? t("pleaseWaitBtn") : t("send")}</button>
    </aside>
  );
}