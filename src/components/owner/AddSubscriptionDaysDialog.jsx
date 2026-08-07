import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AddSubscriptionDaysDialog({ open, onOpenChange, ar, onConfirm }) {
  const [days, setDays] = useState(30);
  const submit = async () => { await onConfirm(Number(days)); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-sm" dir={ar ? "rtl" : "ltr"}><DialogHeader><DialogTitle>{ar ? "إضافة أيام للاشتراك" : "Add subscription days"}</DialogTitle></DialogHeader><div className="space-y-4"><label className="block text-xs text-muted-foreground">{ar ? "عدد الأيام" : "Number of days"}<input type="number" min="1" max="3650" value={days} onChange={(event) => setDays(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-card p-3 text-sm" /></label><div className="flex gap-2">{[7, 30, 90].map((value) => <button key={value} onClick={() => setDays(value)} className="flex-1 rounded-lg border border-border py-2 text-xs hover:bg-muted">+{value}</button>)}</div><button onClick={submit} disabled={!Number(days) || Number(days) < 1} className="w-full rounded-xl bg-primary p-3 text-sm font-semibold text-primary-foreground disabled:opacity-40">{ar ? "إضافة الأيام" : "Add days"}</button></div></DialogContent></Dialog>;
}