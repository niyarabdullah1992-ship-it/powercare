import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const validPlan = (plan) => ["Starter", "Professional", "Enterprise", "Custom"].includes(plan) ? plan : "Starter";
export default function EditSubscriptionDialog({ open, onOpenChange, row, ar, onSaved }) {
  const [form, setForm] = useState({ plan: validPlan(row.plan), start: dateValue(row.startedAt), end: dateValue(row.endsAt), customPrice: row.customPrice ?? "", reason: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setForm({ plan: validPlan(row.plan), start: dateValue(row.startedAt), end: dateValue(row.endsAt), customPrice: row.customPrice ?? "", reason: "" }); }, [open, row]);
  const save = async () => {
    setSaving(true);
    try {
      if (form.plan !== row.plan || (form.plan === "Custom" && Number(form.customPrice) !== Number(row.customPrice))) await base44.functions.invoke("subscriptionOverview", { action: "changePlan", accountId: row.accountId, plan: form.plan, customPrice: form.customPrice, reason: form.reason });
      if (form.end !== dateValue(row.endsAt) || form.start !== dateValue(row.startedAt)) await base44.functions.invoke("subscriptionOverview", { action: "extend", accountId: row.accountId, subscriptionStart: form.start, subscriptionEnd: form.end, reason: form.reason });
      await onSaved(); onOpenChange(false);
    } finally { setSaving(false); }
  };
  const field = (key) => (event) => setForm((value) => ({ ...value, [key]: event.target.value }));
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-md" dir={ar ? "rtl" : "ltr"}><DialogHeader><DialogTitle>{ar ? "إدارة الاشتراك" : "Manage subscription"} — {row.companyName}</DialogTitle></DialogHeader><div className="space-y-3"><label className="block text-xs text-muted-foreground">{ar ? "الباقة" : "Plan"}<select value={form.plan} onChange={field("plan")} className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm">{["Starter", "Professional", "Enterprise", "Custom"].map((plan) => <option key={plan}>{plan}</option>)}</select></label>{form.plan === "Custom" && <label className="block text-xs text-muted-foreground">{ar ? "السعر الشهري المخصص ($)" : "Custom monthly price ($)"}<input type="number" min="0" value={form.customPrice} onChange={field("customPrice")} className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm" /></label>}<div className="grid grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">{ar ? "البداية" : "Start"}<input type="date" value={form.start} onChange={field("start")} className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm" /></label><label className="text-xs text-muted-foreground">{ar ? "النهاية / التمديد" : "End / extend"}<input type="date" value={form.end} onChange={field("end")} className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm" /></label></div><label className="block text-xs text-muted-foreground">{ar ? "سبب التغيير" : "Reason for change"}<textarea value={form.reason} onChange={field("reason")} className="mt-1 min-h-20 w-full rounded-xl border border-border bg-card p-3 text-sm" /></label><button onClick={save} disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{ar ? "حفظ التغييرات" : "Save changes"}</button></div></DialogContent></Dialog>;
}