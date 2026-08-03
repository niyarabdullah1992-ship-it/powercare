import React from "react";
import { PackagePlus, ArrowLeftRight, PackageMinus, History } from "lucide-react";

export default function InventoryWorkflow({ onNavigate, ar }) {
  const steps = [
    ["purchase", PackagePlus, ar ? "المشتريات / الإدخال" : "Purchase / Entry", ar ? "أدخل جميع بيانات الصنف والكمية والفاتورة" : "Enter all item, quantity and invoice details"],
    ["items", ArrowLeftRight, ar ? "الأصناف" : "Items", ar ? "راجع الأصناف المتاحة وأماكن وجودها" : "Review available items and their stations"],
    ["requests", History, ar ? "طلب من محطة" : "Station request", ar ? "اطلب صنفاً وتنتظر موافقة محطة المصدر" : "Request an item and await source approval"],
    ["consumption", PackageMinus, ar ? "الصرف للعمل" : "Issue to work", ar ? "اصرف مباشرة من رصيد المحطة ووثّق المهمة والمستلم" : "Issue directly from station stock and document the task and recipient"],
  ];
  const gridDirection = ar ? "[direction:rtl]" : "[direction:ltr]";
  return <section className="rounded-xl border border-accent/30 bg-card px-4 py-7 shadow-soft md:px-7 md:py-8">
    <div className="mb-9 text-center"><p className="font-mono text-[10px] uppercase tracking-widest text-accent">NiroVera Workflow</p><h2 className="mt-2 font-heading text-3xl font-bold md:text-4xl">{ar ? "دورة حركة الصنف" : "Item movement cycle"}</h2><p className="mt-3 text-lg text-foreground/70 md:text-xl">{ar ? "تبدأ بالشراء وتنتهي عند صرف الصنف للعمل." : "Starts with purchase and ends when the item is issued to work."}</p></div>
    <div className={`grid gap-x-5 gap-y-9 md:grid-cols-2 xl:grid-cols-4 ${gridDirection}`}>{steps.map(([key, Icon, title, text], index) => <button type="button" key={key} onClick={() => onNavigate(key)} className="relative flex min-h-44 flex-col items-center justify-center rounded-lg border border-accent/35 bg-secondary/40 px-4 pb-4 pt-7 text-center hover:border-accent hover:bg-accent/5"><span className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent bg-primary text-base font-bold text-accent shadow-sm">{index + 1}</span><Icon className="mb-3 h-8 w-8 text-accent" strokeWidth={1.6} /><span className="block text-lg font-bold leading-snug text-foreground">{title}</span><span className="mt-1.5 block max-w-48 text-sm leading-5 text-muted-foreground">{text}</span></button>)}</div>
  </section>;
}