import React from "react";
import { Boxes, ClipboardList, PackagePlus, ScanLine } from "lucide-react";

export default function InventoryWorkflow({ canManage, onNavigate, ar }) {
  const managerSteps = [
    ["items", PackagePlus, ar ? "إضافة صنف" : "Add item", ar ? "سجّل المادة وطريقة تتبعها" : "Register material and tracking"],
    ["movements", Boxes, ar ? "استلام أو تحويل" : "Receive or transfer", ar ? "حدّث رصيد المحطة" : "Update station stock"],
    ["requests", ClipboardList, ar ? "مراجعة الطلبات" : "Review requests", ar ? "اعتماد الطلب قبل الصرف" : "Approve before issuing"],
    ["scanner", ScanLine, ar ? "المسح والصرف" : "Scan and issue", ar ? "امسح QR وخصم الرصيد" : "Scan QR and deduct stock"],
  ];
  const employeeSteps = [
    ["items", Boxes, ar ? "عرض المواد" : "Browse materials", ar ? "راجع رصيد محطتك" : "Check your station stock"],
    ["requests", ClipboardList, ar ? "طلب مادة" : "Request material", ar ? "حدد المادة والكمية والسبب" : "Choose item, quantity and reason"],
  ];
  const steps = canManage ? managerSteps : employeeSteps;

  return <section className="space-y-3 rounded-2xl border border-accent/25 bg-secondary/40 p-4">
    <div><h2 className="font-heading text-xl font-semibold">{ar ? "طريقة التخزين السهلة" : "Simple inventory workflow"}</h2><p className="text-sm text-muted-foreground">{ar ? "اختر العملية المطلوبة وسيأخذك النظام إليها مباشرة." : "Choose an operation to go directly to it."}</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{steps.map(([key, Icon, title, text], index) => <button type="button" key={`${key}-${title}`} onClick={() => onNavigate(key)} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-start hover:border-accent/50 hover:bg-secondary/50"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">{index + 1}</span><span><span className="flex items-center gap-1.5 font-semibold"><Icon className="h-4 w-4 text-accent" />{title}</span><span className="mt-1 block text-xs text-muted-foreground">{text}</span></span></button>)}</div>
  </section>;
}