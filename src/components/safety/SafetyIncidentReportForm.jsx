import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function SafetyIncidentReportForm({ station, ar, onSubmit }) {
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    const saved = await onSubmit(description.trim());
    if (saved) setDescription("");
    setSubmitting(false);
  };

  return <form onSubmit={submit} className="rounded-xl border border-amber-300 bg-card p-4">
    <div className="mb-3 flex items-start gap-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div><h2 className="font-heading text-lg font-semibold">{ar ? "رفع بلاغ سلامة" : "Submit a safety report"}</h2><p className="text-xs text-muted-foreground">{station?.name}</p></div>
    </div>
    <textarea value={description} onChange={(event) => setDescription(event.target.value)} required placeholder={ar ? "اكتب وصف الخطر أو الحادث بوضوح..." : "Clearly describe the hazard or incident..."} className="min-h-24 w-full rounded-lg border border-input px-3 py-2 text-sm" />
    <button disabled={submitting || !description.trim()} className="mt-3 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50">{submitting ? (ar ? "جارٍ الإرسال..." : "Submitting...") : (ar ? "إرسال البلاغ" : "Submit report")}</button>
  </form>;
}