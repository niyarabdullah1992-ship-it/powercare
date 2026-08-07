import React from "react";
import { Boxes, ShoppingCart, ClipboardList, PackageMinus, History, LayoutDashboard } from "lucide-react";
import SectionToolbar from "@/components/shared/SectionToolbar";

export default function InventoryTabs({ active, onChange, actions = [], ar }) {
  const tabs = [
    { key: "overview", icon: LayoutDashboard, label: ar ? "نظرة عامة" : "Overview" },
    { key: "purchases", icon: ShoppingCart, label: ar ? "المشتريات" : "Purchases" },
    { key: "items", icon: Boxes, label: ar ? "الأصناف" : "Items" },
    { key: "requests", icon: ClipboardList, label: ar ? "طلبات المحطات" : "Station requests" },
    { key: "consumption", icon: PackageMinus, label: ar ? "الصرف للعمل" : "Issue to work" },
    { key: "movements", icon: History, label: ar ? "سجل الحركات" : "Movements" },
  ];
  return <SectionToolbar tabs={tabs} activeTab={active} onTabChange={onChange} actions={actions} />;
}