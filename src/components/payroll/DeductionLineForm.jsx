import React, { useState } from "react";
import { Plus } from "lucide-react";
import { DEDUCTION_SOURCES, sourceLabel } from "@/lib/payrollDeductions";
import { article90MaxDeduction } from "@/lib/payrollDerivations";
import { MUTED, BORDER, SURFACE, DANGER, field, textarea, ui } from "@/lib/platformStyles";

// Adding a deduction is only possible with a source, and a written reason when manual.
export default function DeductionLineForm({ ar, item, onAdd }) {
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
    ARTICLE_90_EXCEEDED: ar
      ? `يتجاوز حد المادة 90 — الحد الأقصى ${article90MaxDeduction(item || {}).toLocaleString()} ${item?.currency || "SAR"} (نصف الأجر الأساسي + البدلات).`
      : `Exceeds Art. 90 cap — maximum ${article90MaxDeduction(item || {}).toLocaleString()} ${item?.currency || "SAR"} (half of base + allowances).`,
  };

  const submit = () => {
    const code = onAdd({ source, amount, reason, sourceRefId });
    if (code) { setError(messages[code] || code); return; }
    setError(""); setAmount(""); setReason(""); setSourceRefId("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderRadius: "11px", border: `1px solid ${BORDER}`, background: SURFACE, padding: "12px 13px" }}>
      <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: MUTED }}>
        {ar ? "إضافة بند خصم موثّق" : "Add a documented deduction line"}
      </p>
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <select value={source} onChange={(e) => setSource(e.target.value)} style={field}>
          {DEDUCTION_SOURCES.map((key) => <option key={key} value={key}>{sourceLabel(key, ar)}</option>)}
        </select>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={ar ? "المبلغ" : "Amount"}
          aria-label={ar ? "المبلغ" : "Amount"}
          style={field}
        />
      </div>
      {source === "manual" ? (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder={ar ? "السبب المكتوب (إلزامي) — يُقيَّد في سجل التدقيق" : "Written reason (required) — recorded in the audit log"}
          aria-label={ar ? "سبب الخصم" : "Deduction reason"}
          style={textarea}
        />
      ) : (
        <input
          type="text"
          value={sourceRefId}
          onChange={(e) => setSourceRefId(e.target.value)}
          placeholder={source === "attendance" ? (ar ? "معرّف سجل الغياب المعتمد" : "Approved absence record id") : (ar ? "معرّف السلفة" : "Advance record id")}
          aria-label={ar ? "المرجع" : "Reference"}
          style={field}
          dir="ltr"
        />
      )}
      {error && <p style={{ margin: 0, fontSize: "12px", color: DANGER }}>{error}</p>}
      <button type="button" onClick={submit} style={{ ...ui.btnPrimary, display: "inline-flex", alignItems: "center", gap: "6px", alignSelf: "flex-start" }}>
        <Plus style={{ width: 14, height: 14 }} /> {ar ? "إضافة البند" : "Add line"}
      </button>
      {source === "attendance" && (
        <p style={{ margin: 0, fontSize: "11px", color: MUTED, lineHeight: 1.6 }}>
          {ar ? "لا يُقبل سجل غياب قيد المراجعة — الغياب المعتمد فقط." : "Absences still pending review are not accepted — approved records only."}
        </p>
      )}
      {item && (
        <p style={{ margin: 0, fontSize: "11px", color: MUTED, lineHeight: 1.6 }}>
          {ar
            ? `حد المادة 90: ${article90MaxDeduction(item).toLocaleString()} ${item.currency} (50% من الأساسي + البدلات).`
            : `Art. 90 cap: ${article90MaxDeduction(item).toLocaleString()} ${item.currency} (50% of base + allowances).`}
        </p>
      )}
    </div>
  );
}
