import React from "react";
import { Boxes, AlertTriangle, ClipboardList, ArrowLeftRight, Check } from "lucide-react";

export default function InventoryStats({ items = [], requests = [], movements = [], ar }) {
  const low = items.filter((item) => Number(item.quantity) <= Number(item.minimumStock)).length;
  const pending = requests.filter((request) => request.status === "pending").length;
  const cards = [
    { icon: Boxes, label: ar ? "الأصناف" : "Items", value: items.length, card: "border-accent/30", iconStyle: "bg-accent/15 text-accent", valueStyle: "text-accent", edge: "bg-accent" },
    { icon: low ? AlertTriangle : Check, label: ar ? "تحت الحد الأدنى" : "Low stock", value: low, card: low ? "border-orange-300" : "border-emerald-300", iconStyle: low ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700", valueStyle: low ? "text-orange-700" : "text-emerald-700", edge: low ? "bg-orange-500" : "bg-emerald-500" },
    { icon: ClipboardList, label: ar ? "طلبات معلقة" : "Pending requests", value: pending, card: pending ? "border-orange-300" : "border-border", iconStyle: pending ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground", valueStyle: pending ? "text-orange-700" : "text-foreground", edge: pending ? "bg-orange-500" : "bg-muted-foreground/40", alert: pending > 0 },
    { icon: ArrowLeftRight, label: ar ? "حركات المخزون" : "Movements", value: movements.length, card: "border-slate-300", iconStyle: "bg-slate-100 text-slate-600", valueStyle: "text-slate-700", edge: "bg-slate-500" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`relative overflow-hidden rounded-xl border bg-card p-4 ${card.card}`}>
            <div className="flex items-start justify-between">
              <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.iconStyle}`}><Icon className="h-5 w-5" /></span>
              {card.alert && <span className="h-3 w-3 animate-pulse rounded-full bg-orange-500" />}
            </div>
            <p className={`mt-3 text-3xl font-bold tabular-nums ${card.valueStyle}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <div className={`absolute inset-x-0 bottom-0 h-1 ${card.edge}`} />
          </div>
        );
      })}
    </div>
  );
}