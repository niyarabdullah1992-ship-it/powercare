import React from "react";
import { Boxes, AlertTriangle, ClipboardList, ArrowLeftRight } from "lucide-react";

export default function InventoryStats({ items, requests, movements, ar }) {
  const low = items.filter((item) => Number(item.quantity) <= Number(item.minimumStock)).length;
  const cards = [
    [Boxes, ar ? "الأصناف" : "Items", items.length],
    [AlertTriangle, ar ? "تحت الحد الأدنى" : "Low stock", low],
    [ClipboardList, ar ? "طلبات معلقة" : "Pending requests", requests.filter((request) => request.status === "pending").length],
    [ArrowLeftRight, ar ? "حركات المخزون" : "Movements", movements.length],
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([Icon, label, value]) => <div key={label} className="rounded-xl border border-border bg-card p-4"><Icon className="h-5 w-5 text-accent" /><p className="mt-3 text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>;
}