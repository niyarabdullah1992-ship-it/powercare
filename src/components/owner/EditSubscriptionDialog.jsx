import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

const toInput = (ts) => (ts ? new Date(ts).toISOString().slice(0, 10) : "");

export default function EditSubscriptionDialog({ open, onOpenChange, row, ar, onSaved }) {
  const [plan, setPlan] = useState(row.plan || "Free");
  const [start, setStart] = useState(toInput(row.startedAt));
  const [end, setEnd] = useState(toInput(row.endsAt));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setPlan(row.plan || "Free");
      setStart(toInput(row.startedAt));
      setEnd(toInput(row.endsAt));
    }
  }, [open, row]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("subscriptionOverview", {
        action: "updateAccount",
        accountId: row.accountId,
        plan,
        subscriptionStart: start,
        subscriptionEnd: end,
      });
      await onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" dir={ar ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="font-heading text-[#3a2f22]">
            {ar ? "تعديل الاشتراك" : "Edit Subscription"} — {row.companyName || row.email}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 font-body">
          <div>
            <label className="block text-xs text-[#3a2f22]/55 mb-1">{ar ? "الباقة" : "Plan"}</label>
            <select value={plan} onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-landing-bg text-[#3a2f22] text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold">
              <option>Free</option>
              <option>Starter</option>
              <option>Professional</option>
              <option>Enterprise</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#3a2f22]/55 mb-1">{ar ? "تاريخ بداية الاشتراك" : "Subscription start date"}</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-landing-bg text-[#3a2f22] text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold" />
          </div>
          <div>
            <label className="block text-xs text-[#3a2f22]/55 mb-1">{ar ? "تاريخ نهاية الاشتراك" : "Subscription end date"}</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-landing-bg text-[#3a2f22] text-sm focus:outline-none focus:ring-2 focus:ring-landing-gold" />
          </div>
          <button onClick={save} disabled={saving}
            className="w-full py-2.5 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {ar ? "حفظ" : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}