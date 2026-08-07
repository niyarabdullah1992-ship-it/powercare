import React from "react";
import { AlertTriangle } from "lucide-react";
import OperationalAlertItem from "@/components/dashboard/OperationalAlertItem";

export default function OperationalAlerts({ alerts, loading, lang }) {
  const ar = lang === "ar";
  return (
    <section className="rounded-2xl border border-amber-500/35 bg-card p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700"><AlertTriangle className="h-5 w-5" /></span>
        <div><h2 className="font-heading text-2xl font-semibold">{ar ? "تنبيهات تشغيلية" : "Operational alerts"}</h2><p className="text-xs text-muted-foreground">{ar ? "اضغط على أي تنبيه لعرض التفاصيل واقتراح نيرو" : "Select an alert to see details and Niro's suggestion"}</p></div>
      </div>
      {loading ? <div className="h-16 animate-pulse rounded-xl bg-muted" /> : alerts.length === 0 ? <p className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">{ar ? "لا توجد مشاكل تشغيلية حالياً." : "No operational issues right now."}</p> : <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">{alerts.map((alert) => <OperationalAlertItem key={alert.id} alert={alert} lang={lang} />)}</div>}
    </section>
  );
}