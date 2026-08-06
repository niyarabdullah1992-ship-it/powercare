import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DEDUCTION_SOURCES, sourceLabel } from "@/lib/payrollDeductions";

// Adding a deduction is only possible with a source, and a written reason when manual.
export default function DeductionLineForm({ ar, onAdd }) {
  const [source, setSource] = useState("attendance");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [sourceRefId, setSourceRefId] = useState("");
  const [error, setError] = useState("");

  const messages = {
    INVALID_AMOUNT: ar ? "أدخل مبلغاً أكبر من صفر." : "Enter an amount greater than zero.",
    SOURCE_REQUIRED: ar ? "حدّد مصدر الخصم." : "Select the deduction source.",
    REASON_REQUIRED: ar ? "الخصم اليدوي يتطلب سبباً مكتوباً واضحاً." : "A manual deduction requires a written reason.",
    REFERENCE_REQUIRED: ar ? "أدخل معرّف السجل المرجعي (سجل الغياب أو السلفة)." : "Enter the reference record id (absence or advance).",
  };

  const submit = () => {
    const code = onAdd({ source, amount, reason, sourceRefId });
    if (code) { setError(messages[code] || code); return; }
    setError(""); setAmount(""); setReason(""); setSourceRefId("");
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[11px] font-body font-semibold uppercase tracking-wider text-muted-foreground">
        {ar ? "إضافة بند خصم موثّق" : "Add a documented deduction line"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-9 rounded-md border border-input bg-card px-2 text-sm font-body">
          {DEDUCTION_SOURCES.map((key) => <option key={key} value={key}>{sourceLabel(key, ar)}</option>)}
        </select>
        <input type="text" inputMode="decimal" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)}
          placeholder={ar ? "المبلغ" : "Amount"} aria-label={ar ? "المبلغ" : "Amount"}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm font-body" />
      </div>
      {source === "manual" ? (
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
          placeholder={ar ? "السبب المكتوب (إلزامي) — يُقيَّد في سجل التدقيق" : "Written reason (required) — recorded in the audit log"}
          aria-label={ar ? "سبب الخصم" : "Deduction reason"}
          className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm font-body" />
      ) : (
        <input type="text" value={sourceRefId} onChange={(e) => setSourceRefId(e.target.value)}
          placeholder={source === "attendance" ? (ar ? "معرّف سجل الغياب المعتمد" : "Approved absence record id") : (ar ? "معرّف السلفة" : "Advance record id")}
          aria-label={ar ? "المرجع" : "Reference"}
          className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm font-body" dir="ltr" />
      )}
      {error && <p className="text-xs font-body text-destructive">{error}</p>}
      <button type="button" onClick={submit} className="inline-flex items-center gap-1.5 rounded-md border border-accent/45 bg-accent px-3 py-1.5 text-xs font-body font-semibold text-accent-foreground hover:bg-accent/90">
        <Plus className="h-3.5 w-3.5" /> {ar ? "إضافة البند" : "Add line"}
      </button>
      {source === "attendance" && (
        <p className="text-[11px] font-body text-muted-foreground">
          {ar ? "لا يُقبل سجل غياب قيد المراجعة — الغياب المعتمد فقط." : "Absences still pending review are not accepted — approved records only."}
        </p>
      )}
    </div>
  );
}