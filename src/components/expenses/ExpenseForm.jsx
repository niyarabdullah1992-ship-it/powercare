import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

const TYPES = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training"];
const LABELS = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };

export default function ExpenseForm({ onSubmit, ar }) {
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true);
    const form = event.currentTarget; const data = new FormData(form); const receipt = data.get("receipt");
    const ok = await onSubmit({ expenseType: data.get("expenseType"), amount: data.get("amount"), expenseDate: data.get("expenseDate"), description: data.get("description"), receipt });
    if (ok) form.reset(); setSaving(false);
  };
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 xl:grid-cols-5">
    <select name="expenseType" required className="rounded-lg border px-3 py-2"><option value="">{ar ? "نوع المصروف" : "Expense type"}</option>{TYPES.map((type) => <option key={type} value={type}>{LABELS[type][ar ? 1 : 0]}</option>)}</select>
    <input name="amount" type="number" min="0.01" step="0.01" required placeholder={ar ? "المبلغ (ر.س)" : "Amount (SAR)"} className="rounded-lg border px-3 py-2" />
    <input name="expenseDate" type="date" required className="rounded-lg border px-3 py-2" />
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-accent/50 px-3 py-2 text-sm"><Camera className="h-4 w-4 text-accent" />{ar ? "تصوير أو رفع الإيصال" : "Capture or upload receipt"}<input name="receipt" type="file" accept="image/*,application/pdf" capture="environment" required className="hidden" /></label>
    <input name="description" placeholder={ar ? "وصف مختصر" : "Short description"} className="rounded-lg border px-3 py-2 xl:col-span-4" />
    <button disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "إرسال المصروف" : "Submit expense"}</button>
  </form>;
}