import React from "react";
import { Boxes, ClipboardList, ArrowLeftRight, ScanLine, LayoutDashboard } from "lucide-react";

export default function InventoryTabs({ active, onChange, canManage, ar }) {
  const tabs = [
    ["overview", LayoutDashboard, ar ? "نظرة عامة" : "Overview"],
    ["items", Boxes, ar ? "الأصناف" : "Items"],
    ["requests", ClipboardList, ar ? "طلبات المواد" : "Requests"],
    ["movements", ArrowLeftRight, ar ? "سجل الحركة" : "Movements"],
    ...(canManage ? [["scanner", ScanLine, ar ? "المسح والصرف" : "Scan & issue"]] : []),
  ];
  return <div className="flex gap-2 overflow-x-auto no-scrollbar">{tabs.map(([key, Icon, label]) => <button key={key} onClick={() => onChange(key)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs ${active === key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>;
}