import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import StationExpenseScope from "@/components/expenses/StationExpenseScope";

const TYPES = ["travel", "accommodation", "fuel", "overtime_meals", "tools_equipment", "training"];
const LABELS = { travel: ["Travel", "سفر"], accommodation: ["Accommodation", "سكن"], fuel: ["Fuel", "وقود"], overtime_meals: ["Overtime Meals", "وجبات العمل الإضافي"], tools_equipment: ["Tools & Equipment", "أدوات ومعدات"], training: ["Training", "تدريب"] };

export default function ExpenseForm({ stations, canPickStations, onSubmit, ar }) {
  const [saving, setSaving] = useState(false); const [type, setType] = useState(""); const [scope, setScope] = useState("all"); const [selected, setSelected] = useState([]); const [amount, setAmount] = useState(0);
  const count = canPickStations ? (scope === "all" ? stations.length : selected.length) : 1; const total = Number(amount || 0) * count;
  const submit = async (event) => { event.preventDefault(); if (canPickStations && !count) return; setSaving(true); const form = event.currentTarget; const data = new FormData(form); const matchedType = TYPES.find((item) => LABELS[item][ar ? 1 : 0].toLowerCase() === type.trim().toLowerCase()); const ok = await onSubmit({ expenseType: matchedType || "other", customExpenseType: matchedType ? "" : type.trim(), amount, expenseDate: data.get("expenseDate"), description: data.get("description"), receipt: data.get("receipt"), stationScope: canPickStations ? scope : "single", stationIds: scope === "selected" ? selected : [] }); if (ok) { form.reset(); setType(""); setSelected([]); setAmount(0); } setSaving(false); };
  return <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:grid-cols-2 xl:grid-cols-5">
    <div><input list="expense-types" required value={type} onChange={(event) => setType(event.target.value)} placeholder={ar ? "اختر أو اكتب نوع المصروف" : "Choose or write expense type"} className="w-full rounded-lg border px-3 py-2" /><datalist id="expense-types">{TYPES.map((item) => <option key={item} value={LABELS[item][ar ? 1 : 0]} />)}</datalist></div>
    <input value={amount || ""} onChange={(event) => setAmount(event.target.value)} type="number" min="0.01" step="0.01" required placeholder={ar ? "المبلغ لكل محطة" : "Amount per station"} className="rounded-lg border px-3 py-2" />
    <input name="expenseDate" type="date" required className="rounded-lg border px-3 py-2" />
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-accent/50 px-3 py-2 text-sm"><Camera className="h-4 w-4 text-accent" />{ar ? "تصوير أو رفع الإيصال" : "Capture or upload receipt"}<input name="receipt" type="file" accept="image/*,application/pdf" capture="environment" required className="hidden" /></label>
    <StationExpenseScope stations={stations} scope={scope} setScope={setScope} selected={selected} setSelected={setSelected} canPick={canPickStations} ar={ar} />
    <div className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent md:col-span-2 xl:col-span-5">{ar ? `الحساب الذكي: ${amount || 0} × ${count} محطة = ${total.toLocaleString()} ر.س` : `Smart total: ${amount || 0} × ${count} stations = ${total.toLocaleString()} SAR`}</div>
    <input name="description" placeholder={ar ? "وصف مختصر" : "Short description"} className="rounded-lg border px-3 py-2 xl:col-span-4" /><button disabled={saving || !count} className="flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground disabled:opacity-50">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "إرسال المصروف" : "Submit expense"}</button>
  </form>;
}