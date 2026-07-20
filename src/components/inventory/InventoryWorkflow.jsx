import React from "react";
import { Plus, PackagePlus, ClipboardList } from "lucide-react";

export default function InventoryWorkflow({ canManage, onNavigate, ar }) {
  const steps = [
    ["create", Plus, ar ? "إنشاء صنف" : "Create item", ar ? "سجّل الصنف في مخزون محطتك" : "Add an item to your station catalog"],
    ["purchase", PackagePlus, ar ? "شراء" : "Purchase", ar ? "سجّل شراء الصنف من مورد" : "Record an item purchase from a supplier"],
    ["request", ClipboardList, ar ? "طلب من محطة" : "Request from station", ar ? "اطلب صنفاً متوفراً في محطة أخرى" : "Request available stock from another station"],
  ];
  const singleCard = false;
  return <section className="rounded-2xl border border-border bg-card px-4 py-7 md:px-7 md:py-8">
    <div className="mb-9 text-center"><h2 className="font-heading text-3xl font-bold md:text-4xl">{ar ? "ابدأ مهمة المخزون" : "Start an inventory task"}</h2><p className="mt-3 text-lg text-foreground/75 md:text-xl">{ar ? "اختر أي مسار وانتقل بينها بحرية." : "Choose any path and switch between them freely."}</p></div>
    <div className={singleCard ? "mx-auto grid w-full max-w-sm grid-cols-1 gap-y-9 [direction:ltr]" : "grid gap-x-5 gap-y-9 [direction:ltr] md:grid-cols-3"}>{steps.map(([key, Icon, title, text], index) => <button type="button" key={key} onClick={() => onNavigate(key)} className={singleCard ? "relative flex min-h-36 flex-col items-center justify-center rounded-lg border-2 border-accent/70 bg-card px-4 pb-4 pt-7 text-center [direction:rtl] hover:border-accent" : "relative flex min-h-44 flex-col items-center justify-center rounded-lg border-2 border-accent/70 bg-card px-4 pb-4 pt-7 text-center [direction:rtl] hover:border-accent"}><span className="absolute left-1/2 top-0 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-base font-bold text-accent-foreground shadow-sm">{index + 1}</span><Icon className="mb-3 h-8 w-8 text-accent" strokeWidth={1.6} /><span className="block text-lg font-bold leading-snug">{title}</span><span className="mt-1.5 block max-w-48 text-sm leading-5 text-foreground/80">{text}</span></button>)}</div>
  </section>;
}