import React from "react";
import { Boxes, ShoppingCart, ClipboardList, PackageMinus, History, LayoutDashboard } from "lucide-react";

export default function InventoryTabs({ active, onChange, ar }) {
  const tabs = [
    { id: "overview", icon: LayoutDashboard, label: ar ? "نظرة عامة" : "Overview" },
    { id: "purchases", icon: ShoppingCart, label: ar ? "المشتريات" : "Purchases" },
    { id: "items", icon: Boxes, label: ar ? "الأصناف" : "Items" },
    { id: "requests", icon: ClipboardList, label: ar ? "طلبات المحطات" : "Station requests" },
    { id: "consumption", icon: PackageMinus, label: ar ? "الاستهلاك" : "Consumption" },
    { id: "movements", icon: History, label: ar ? "سجل الحركات" : "Movements" },
  ];
  return <div className="flex gap-2 overflow-x-auto no-scrollbar">{tabs.map(({ id, icon: Icon, label }) => <button key={id} onClick={() => onChange(id)} className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${active === id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>;
}