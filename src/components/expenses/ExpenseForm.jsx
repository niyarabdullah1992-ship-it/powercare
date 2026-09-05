import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import StationExpenseScope from "@/components/expenses/StationExpenseScope";
import ExpenseReceiptUploader from "@/components/expenses/ExpenseReceiptUploader";
import { ACCENT, MUTED, NAVY, BORDER, SURFACE, BRAND_SOFT, BRAND_BORDER, field, ui, CARD } from "@/lib/platformStyles";

const TYPES = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training"];
const LABELS = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };

const labelStyle = { display: "block", fontSize: "11px", color: MUTED };
const inputWrap = { marginTop: "6px", ...field, height: "auto", minHeight: "36px", padding: "8px 12px" };

export default function ExpenseForm({ stations, canPickStations, onSubmit, ar }) {
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState("");
  const [scope, setScope] = useState("all");
  const [selected, setSelected] = useState([]);
  const [beforeTax, setBeforeTax] = useState("");
  const [tax, setTax] = useState("");
  const [quantity, setQuantity] = useState("");
  const [receipt, setReceipt] = useState({ url: "", name: "" });
  const count = canPickStations ? (scope === "all" ? stations.length : selected.length) : 1;
  const afterTax = Number(beforeTax || 0) + Number(tax || 0);
  const total = afterTax * count;

  const submit = async (event) => {
    event.preventDefault();
    if ((canPickStations && !count) || !receipt.url || afterTax <= 0) return;
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);
    const matchedType = TYPES.find((item) => LABELS[item][ar ? 1 : 0].toLowerCase() === type.trim().toLowerCase());
    const ok = await onSubmit({
      expenseType: matchedType || "other",
      customExpenseType: matchedType ? "" : type.trim(),
      beforeTaxAmount: Number(beforeTax),
      taxAmount: Number(tax || 0),
      afterTaxAmount: afterTax,
      quantity: quantity === "" ? null : Number(quantity),
      invoiceNumber: String(data.get("invoiceNumber") || "").trim(),
      amount: afterTax,
      expenseDate: data.get("expenseDate"),
      description: data.get("description"),
      receiptUrl: receipt.url,
      stationScope: canPickStations ? scope : "single",
      stationIds: scope === "selected" ? selected : [],
    });
    if (ok) {
      form.reset();
      setType("");
      setSelected([]);
      setBeforeTax("");
      setTax("");
      setQuantity("");
      setReceipt({ url: "", name: "" });
    }
    setSaving(false);
  };

  return (
    <form
      onSubmit={submit}
      style={{
        display: "grid",
        gap: "12px",
        borderRadius: "16px",
        border: `1px solid ${BORDER}`,
        background: CARD,
        padding: "18px 20px",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      }}
    >
      <label style={labelStyle}>
        {ar ? "نوع المصروف" : "Expense type"}
        <input list="expense-types" required value={type} onChange={(event) => setType(event.target.value)} placeholder={ar ? "اكتب نوع المصروف بحرية" : "Write any expense type"} style={inputWrap} />
        <datalist id="expense-types">{TYPES.map((item) => <option key={item} value={LABELS[item][ar ? 1 : 0]} />)}</datalist>
      </label>
      <label style={labelStyle}>
        {ar ? "الفاتورة قبل الضريبة" : "Invoice before tax"}
        <input value={beforeTax} onChange={(event) => setBeforeTax(event.target.value)} type="number" min="0" step="0.01" required placeholder="0.00" style={inputWrap} />
      </label>
      <label style={labelStyle}>
        {ar ? "قيمة الضريبة" : "Tax amount"}
        <input value={tax} onChange={(event) => setTax(event.target.value)} type="number" min="0" step="0.01" required placeholder="0.00" style={inputWrap} />
      </label>
      <label style={labelStyle}>
        {ar ? "الفاتورة بعد الضريبة" : "Invoice after tax"}
        <input value={afterTax || ""} readOnly style={{ ...inputWrap, background: SURFACE, fontWeight: 600, color: NAVY }} />
      </label>
      <label style={labelStyle}>
        {ar ? "تاريخ الفاتورة" : "Invoice date"}
        <input name="expenseDate" type="date" required style={inputWrap} />
      </label>
      <label style={labelStyle}>
        {ar ? "رقم الفاتورة" : "Invoice number"}
        <input name="invoiceNumber" placeholder={ar ? "اختياري" : "Optional"} style={inputWrap} />
      </label>
      <label style={labelStyle}>
        {ar ? "الكمية (إن وجدت)" : "Quantity (if any)"}
        <input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0.01" step="0.01" placeholder={ar ? "اختياري" : "Optional"} style={inputWrap} />
      </label>
      <ExpenseReceiptUploader value={receipt.url} fileName={receipt.name} onChange={(url, name) => setReceipt({ url, name })} ar={ar} />
      <div style={{ gridColumn: "1 / -1" }}>
        <StationExpenseScope stations={stations} scope={scope} setScope={setScope} selected={selected} setSelected={setSelected} canPick={canPickStations} ar={ar} />
      </div>
      <div style={{
        gridColumn: "1 / -1",
        borderRadius: "10px",
        border: `1px solid ${BRAND_BORDER}`,
        background: BRAND_SOFT,
        padding: "11px 13px",
        fontSize: "13px",
        color: ACCENT,
        fontWeight: 500,
      }}>
        {ar ? `الإجمالي بعد الضريبة: ${afterTax.toLocaleString()} × ${count} فرع = ${total.toLocaleString()} ر.س` : `After-tax total: ${afterTax.toLocaleString()} × ${count} stations = ${total.toLocaleString()} SAR`}
      </div>
      <input
        name="description"
        placeholder={ar ? "وصف مختصر" : "Short description"}
        style={{ ...inputWrap, gridColumn: "1 / -2", minWidth: 0 }}
      />
      <button
        disabled={saving || !count || !receipt.url || afterTax <= 0}
        style={{
          ...ui.btnPrimary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          height: "40px",
          opacity: saving || !count || !receipt.url || afterTax <= 0 ? 0.5 : 1,
          cursor: saving || !count || !receipt.url || afterTax <= 0 ? "not-allowed" : "pointer",
        }}
      >
        {saving && <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />}
        {ar ? "إرسال المصروف" : "Submit expense"}
      </button>
    </form>
  );
}
