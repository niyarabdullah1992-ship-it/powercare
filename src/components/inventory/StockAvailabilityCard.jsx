import React from "react";
import { AlertTriangle, CheckCircle2, Gauge } from "lucide-react";

export default function StockAvailabilityCard({ balance, minimumStock, requestedQuantity, ar }) {
  const exceeds = requestedQuantity > balance;
  const remaining = balance - requestedQuantity;
  const low = !exceeds && remaining <= minimumStock;
  const tone = exceeds ? "border-destructive/30 bg-destructive/5 text-destructive" : low ? "border-orange-500/30 bg-orange-500/5 text-orange-700" : "border-emerald-600/30 bg-emerald-600/5 text-emerald-700";
  const Icon = exceeds || low ? AlertTriangle : CheckCircle2;
  const message = exceeds
    ? (ar ? `الكمية المطلوبة تتجاوز المتاح بمقدار ${requestedQuantity - balance}.` : `Requested quantity exceeds stock by ${requestedQuantity - balance}.`)
    : low
      ? (ar ? `سيصبح الرصيد منخفضاً بعد الموافقة: ${remaining}.` : `Stock will be low after approval: ${remaining}.`)
      : (ar ? `الرصيد كافٍ، والمتبقي بعد الموافقة: ${remaining}.` : `Stock is sufficient; ${remaining} will remain after approval.`);

  return <div className={`rounded-lg border p-3 ${tone}`}>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div><Gauge className="mx-auto mb-1 h-4 w-4" /><p className="text-[10px] opacity-75">{ar ? "الرصيد الحالي" : "Current stock"}</p><b className="text-sm">{balance}</b></div>
      <div className="border-x border-current/15"><p className="text-[10px] opacity-75">{ar ? "الحد الأدنى" : "Minimum"}</p><b className="text-sm">{minimumStock}</b></div>
      <div><p className="text-[10px] opacity-75">{ar ? "بعد الطلب" : "After request"}</p><b className="text-sm">{exceeds ? "—" : remaining}</b></div>
    </div>
    <p className="mt-2 flex items-center gap-1.5 border-t border-current/15 pt-2 text-xs font-medium"><Icon className="h-4 w-4 shrink-0" />{message}</p>
  </div>;
}