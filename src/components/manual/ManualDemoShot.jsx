import React from "react";
import { Bell, CheckCircle2, Menu, Plus, Search } from "lucide-react";
import { MANUAL_DEMO_DATA } from "@/lib/manualDemoData";

export default function ManualDemoShot({ chapterId, title, language }) {
  const data = MANUAL_DEMO_DATA[chapterId] || MANUAL_DEMO_DATA.dashboard;
  const ar = language === "ar";
  return <div className="manual-screen-shot overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-elevated" data-capture-ready="true">
    <div className="flex h-10 items-center gap-2 bg-primary px-4 text-primary-foreground"><Menu className="h-4 w-4" /><b className="text-xs">NiroVera</b><span className="mx-auto rounded-full bg-primary-foreground/10 px-3 py-1 text-[10px]">{ar ? "بيانات توضيحية غير حقيقية" : "Illustrative demo data"}</span><Bell className="h-4 w-4" /></div>
    <div className="bg-background p-3 sm:p-5">
      <div className="flex items-center justify-between gap-3"><div><p className="text-[9px] uppercase tracking-widest text-accent">{ar ? "دليل الاستخدام" : "USER MANUAL"}</p><h4 className="font-heading text-base font-semibold sm:text-xl">{ar ? data.titleAr : data.title || title}</h4></div><button type="button" className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-2 text-[10px] font-semibold text-accent-foreground"><Plus className="h-3 w-3" />{ar ? "إضافة جديد" : "Add new"}</button></div>
      <div className="mt-3 grid grid-cols-3 gap-2">{data.metrics.map(([label, labelAr, value]) => <div key={label} className="rounded-xl border border-border bg-card p-2.5"><p className="text-[9px] text-muted-foreground">{ar ? labelAr : label}</p><b className="mt-1 block text-sm text-primary sm:text-lg">{value}</b></div>)}</div>
      <div className="mt-3 flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-[10px] text-muted-foreground"><Search className="h-3.5 w-3.5" />{ar ? "بحث وتصفية السجلات..." : "Search and filter records..."}</div>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">{data.rows.map((row, index) => <div key={row.label} className={`grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] items-center gap-2 px-3 py-2.5 text-[9px] sm:text-[11px] ${index ? "border-t border-border" : ""}`}><div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-accent">{index + 1}</span><b className="truncate">{ar ? row.labelAr : row.label}</b></div><span className="truncate text-muted-foreground">{ar ? row.ownerAr : row.owner}</span><span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-primary"><CheckCircle2 className="h-3 w-3" />{ar ? row.statusAr : row.status}</span></div>)}</div>
    </div>
  </div>;
}