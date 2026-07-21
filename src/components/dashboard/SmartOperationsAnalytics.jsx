import React from "react";
import { MessageSquareWarning, PackageSearch, ReceiptText, Sparkles } from "lucide-react";
import useSmartOperationsAnalytics from "@/hooks/useSmartOperationsAnalytics";
import SmartOperationsChart from "@/components/dashboard/SmartOperationsChart";

export default function SmartOperationsAnalytics({ session, data, lang }) {
  const { claims, items, complaints, loading } = useSmartOperationsAnalytics(session, data);
  const ar = lang === "ar";
  const expenseAttention = claims.filter((x) => !["finance_approved", "finance_rejected", "manager_rejected"].includes(x.status)).length;
  const complaintAttention = complaints.filter((x) => !["closed", "resolved", "rejected"].includes(x.status)).length;
  const lowStock = items.filter((x) => Number(x.quantity || 0) <= Number(x.minimumStock || 0)).length;
  const rows = [
    { name: ar ? "المصروفات" : "Expenses", value: expenseAttention, total: claims.length, icon: ReceiptText },
    { name: ar ? "الشكاوى" : "Complaints", value: complaintAttention, total: complaints.length, icon: MessageSquareWarning },
    { name: ar ? "المخزون" : "Inventory", value: lowStock, total: items.length, icon: PackageSearch },
  ];
  const priority = rows.reduce((highest, row) => row.value > highest.value ? row : highest, rows[0]);
  return (
    <section className="luxury-analytics overflow-hidden rounded-2xl p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs text-holo-green">{ar ? "تحليل تشغيلي مباشر" : "Live operational analysis"}</p><h2 className="mt-1 font-heading text-2xl text-white">{ar ? "لوحة التحليل الذكية" : "Smart analytics board"}</h2></div><Sparkles className="h-5 w-5 text-holo-green" /></div>
      {loading ? <div className="h-64 animate-pulse rounded-2xl bg-white/5" /> : <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]"><div className="grid gap-4">{rows.map(({ icon: Icon, ...row }) => <div key={row.name} className="holo-kpi holo-float-card flex items-center gap-4 rounded-2xl p-4"><Icon className="h-5 w-5 text-holo-green" /><div className="flex-1"><p className="text-sm text-white">{row.name}</p><p className="text-xs text-slate-500">{row.total} {ar ? "سجل" : "records"}</p></div><strong className="text-2xl font-light text-holo-green">{row.value}</strong></div>)}<p className="flex items-center gap-2 text-sm text-white/70"><Sparkles className="h-4 w-4 text-holo-green" />{priority.value ? (ar ? `الأولوية الحالية: ${priority.name}` : `Current priority: ${priority.name}`) : (ar ? "الوضع التشغيلي مستقر" : "Operations are stable")}</p></div><SmartOperationsChart rows={rows} /></div>}
    </section>
  );
}