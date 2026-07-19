import React from "react";
import { Boxes, PackagePlus, ArrowLeftRight, ShoppingCart } from "lucide-react";

export default function InventoryWorkflow({ canManage, onNavigate, ar }) {
  const managerSteps = [
    ["items", PackagePlus, ar ? "شراء جديد" : "New purchase", ar ? "أضف الصنف والمورد والتكلفة" : "Add item, supplier and cost"],
    ["movements", ArrowLeftRight, ar ? "نقل بين المحطات" : "Station transfer", ar ? "انقل الرصيد مع توثيق المحطتين" : "Move stock with full tracking"],
    ["purchases", ShoppingCart, ar ? "تحليل المشتريات" : "Purchase analytics", ar ? "راجع التكاليف والموردين" : "Review costs and suppliers"],
  ];
  const employeeSteps = [["items", Boxes, ar ? "عرض المواد" : "Browse materials", ar ? "راجع رصيد محطتك" : "Check your station stock"]];
  const steps = canManage ? managerSteps : employeeSteps;
  return <section className="space-y-3 rounded-2xl border border-accent/25 bg-secondary/40 p-4">
    <div><h2 className="font-heading text-xl font-semibold">{ar ? "إدارة مخزن المحطة" : "Station inventory workflow"}</h2><p className="text-sm text-muted-foreground">{ar ? "شراء مباشر ونقل موثّق بين المحطات." : "Direct purchasing and tracked station transfers."}</p></div>
    <div className="grid gap-3 md:grid-cols-3">{steps.map(([key, Icon, title, text], index) => <button type="button" key={key} onClick={() => onNavigate(key)} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-start hover:border-accent/50"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">{index + 1}</span><span><span className="flex items-center gap-1.5 font-semibold"><Icon className="h-4 w-4 text-accent" />{title}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span></button>)}</div>
  </section>;
}