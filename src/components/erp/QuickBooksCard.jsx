import React from "react";
import { Calculator, Clock } from "lucide-react";

export default function QuickBooksCard({ ar }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center"><Calculator className="w-4 h-4" strokeWidth={1.75} /></span>
        <h3 className="font-heading font-semibold">QuickBooks</h3>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-body dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
          <Clock className="w-3 h-3" /> {ar ? "بانتظار الربط" : "Awaiting connection"}
        </span>
      </div>
      <p className="text-sm text-muted-foreground font-body leading-relaxed">
        {ar
          ? "بعد ربط حساب QuickBooks، سيُرحَّل مسيّر الرواتب الشهري تلقائيًا كقيود محاسبية إلى دفاترك. اعتمد طلب الربط الظاهر في المحادثة لإتمام التفعيل."
          : "Once your QuickBooks account is connected, the monthly payroll run posts automatically as journal entries to your books. Approve the connection request shown in the chat to activate."}
      </p>
    </div>
  );
}