import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import StationExpenseScope from "@/components/expenses/StationExpenseScope";
import ExpenseReceiptUploader from "@/components/expenses/ExpenseReceiptUploader";

const TYPES = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training"];
const LABELS = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };

export default function ExpenseForm({ stations, canPickStations, onSubmit, ar }) {
  const [saving, setSaving] = useState(false); const [type, setType] = useState(""); const [scope, setScope] = useState("all"); const [selected, setSelected] = useState([]); const [beforeTax, setBeforeTax] = useState(""); const [tax, setTax] = useState(""); const [quantity, setQuantity] = useState(""); const [receipt, setReceipt] = useState({ url: "", name: "" });
  const count = canPickStations ? (scope === "all" ? stations.length : selected.length) : 1;
  const afterTax = Number(beforeTax || 0) + Number(tax || 0); const total = afterTax * count;
  const submit = async (event) => { event.preventDefault(); if ((canPickStations && !count) || !receipt.url || afterTax <= 0) return; setSaving(true); const form = event.currentTarget; const data = new FormData(form); const matchedType = TYPES.find((item) => LABELS[item][ar ? 1 : 0].toLowerCase() === type.trim().toLowerCase()); const ok = await onSubmit({ expenseType: matchedType || "other", customExpenseType: matchedType ? "" : type.trim(), beforeTaxAmount: Number(beforeTax), taxAmount: Number(tax || 0), afterTaxAmount: afterTax, quantity: quantity === "" ? null : Number(quantity), invoiceNumber: String(data.get("invoiceNumber") || "").trim(), amount: afterTax, expenseDate: data.get("expenseDate"), description: data.get("description"), receiptUrl: receipt.url, stationScope: canPickStations ? scope : "single", stationIds: scope === "selected" ? selected : [] }); if (ok) { form.reset(); setType(""); setSelected([]); setBeforeTax(""); setTax(""); setQuantity(""); setReceipt({ url: "", name: "" }); } setSaving(false); };
  const fieldClass = "mt-1 w-full rounded-lg border px-3 py-2";
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 xl:grid-cols-4">
    <label className="text-xs text-muted-foreground">{ar ? "نوع المصروف" : "Expense type"}<input list="expense-types" required value={type} onChange={(event) => setType(event.target.value)} placeholder={ar ? "اكتب نوع المصروف بحرية" : "Write any expense type"} className={fieldClass} /><datalist id="expense-types">{TYPES.map((item) => <option key={item} value={LABELS[item][ar ? 1 : 0]} />)}</datalist></label>
    <label className="text-xs text-muted-foreground">{ar ? "الفاتورة قبل الضريبة" : "Invoice before tax"}<input value={beforeTax} onChange={(event) => setBeforeTax(event.target.value)} type="number" min="0" step="0.01" required placeholder="0.00" className={fieldClass} /></label>
    <label className="text-xs text-muted-foreground">{ar ? "قيمة الضريبة" : "Tax amount"}<input value={tax} onChange={(event) => setTax(event.target.value)} type="number" min="0" step="0.01" required placeholder="0.00" className={fieldClass} /></label>
    <label className="text-xs text-muted-foreground">{ar ? "الفاتورة بعد الضريبة" : "Invoice after tax"}<input value={afterTax || ""} readOnly className={`${fieldClass} bg-muted font-semibold`} /></label>
    <label className="text-xs text-muted-foreground">{ar ? "تاريخ الفاتورة" : "Invoice date"}<input name="expenseDate" type="date" required className={fieldClass} /></label>
    <label className="text-xs text-muted-foreground">{ar ? "رقم الفاتورة" : "Invoice number"}<input name="invoiceNumber" placeholder={ar ? "اختياري" : "Optional"} className={fieldClass} /></label>
    <label className="text-xs text-muted-foreground">{ar ? "الكمية (إن وجدت)" : "Quantity (if any)"}<input value={quantity} onChange={(event) => setQuantity(event.target.value)} type="number" min="0.01" step="0.01" placeholder={ar ? "اختياري" : "Optional"} className={fieldClass} /></label>
    <ExpenseReceiptUploader value={receipt.url} fileName={receipt.name} onChange={(url, name) => setReceipt({ url, name })} ar={ar} />
    <StationExpenseScope stations={stations} scope={scope} setScope={setScope} selected={selected} setSelected={setSelected} canPick={canPickStations} ar={ar} />
    <div className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent md:col-span-2 xl:col-span-4">{ar ? `الإجمالي بعد الضريبة: ${afterTax.toLocaleString()} × ${count} محطة = ${total.toLocaleString()} ر.س` : `After-tax total: ${afterTax.toLocaleString()} × ${count} stations = ${total.toLocaleString()} SAR`}</div>
    <input name="description" placeholder={ar ? "وصف مختصر" : "Short description"} className="rounded-lg border px-3 py-2 xl:col-span-3" /><button disabled={saving || !count || !receipt.url || afterTax <= 0} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "إرسال المصروف" : "Submit expense"}</button>
  </form>;
}