import React from "react";
import { PackagePlus, ArrowLeftRight, PackageMinus, History } from "lucide-react";

export default function InventoryWorkflow({ onNavigate, ar }) {
  const steps = [
    ["purchase", PackagePlus, ar ? "المشتريات / الإدخال" : "Purchase / Entry", ar ? "أدخل جميع بيانات الصنف والكمية والفاتورة" : "Enter all item, quantity and invoice details"],
    ["items", ArrowLeftRight, ar ? "الأصناف" : "Items", ar ? "راجع الأصناف المتاحة وأماكن وجودها" : "Review available items and their stations"],
    ["requests", History, ar ? "طلب من محطة" : "Station request", ar ? "اطلب صنفاً وتنتظر موافقة محطة المصدر" : "Request an item and await source approval"],
    ["consumption", PackageMinus, ar ? "تسجيل الاستهلاك" : "Record consumption", ar ? "وثق الكمية والمهمة والمستلم كآخر حركة" : "Document quantity, task and recipient as the final movement"],
  ];
  const gridDirection = ar ? "[direction:rtl]" : "[direction:ltr]";
  return <section className="rounded-2xl border border-border bg-card px-4 py-7 md:px-7 md:py-8">
    <div className="mb-9 text-center"><h2 className="font-heading text-3xl font-bold md:text-4xl">{ar ? "دورة حركة الصنف" : "Item movement cycle"}</h2><p className="mt-3 text-lg text-foreground/75 md:text-xl">{ar ? "تبدأ بالشراء وتنتهي عند صرف الصنف للعمل." : "Starts with purchase and ends when the item is issued to work."}</p></div>
    <div className={`grid gap-x-5 gap-y-9 md:grid-cols-2 xl:grid-cols-4 ${gridDirection}`}>{steps.map(([key, Icon, title, text], index) => <button type="button" key={key} onClick={() => onNavigate(key)} className="relative flex min-h-44 flex-col items-center justify-center rounded-lg border-2 border-accent/70 bg-card px-4 pb-4 pt-7 text-center hover:border-accent"><span className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-sm">{index + 1}</span><Icon className="mb-3 h-8 w-8 text-accent" strokeWidth={1.6} /><span className="block text-lg font-bold leading-snug">{title}</span><span className="mt-1.5 block max-w-48 text-sm leading-5 text-foreground/80">{text}</span></button>)}</div>
  </section>;
}