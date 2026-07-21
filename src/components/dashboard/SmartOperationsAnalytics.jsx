import React from "react";
import { MessageSquareWarning, PackageSearch, ReceiptText, Sparkles } from "lucide-react";
import useSmartOperationsAnalytics from "@/hooks/useSmartOperationsAnalytics";
import SmartOperationsChart from "@/components/dashboard/SmartOperationsChart";

const recordMonth = (record) => {
  const date = new Date(record.expenseDate || record.created_date || record.createdAt || record.purchaseDate || record.updated_date);
  return Number.isNaN(date.getTime()) ? "" : `${date.getFullYear()}-${date.getMonth()}`;
};

export default function SmartOperationsAnalytics({ session, data, lang }) {
  const { claims, items, movements, complaints, loading } = useSmartOperationsAnalytics(session, data);
  const ar = lang === "ar";
  const rows = [
    { name: ar ? "المصروفات" : "Expenses", value: claims.filter((x) => !["finance_approved", "finance_rejected", "manager_rejected"].includes(x.status)).length, total: claims.length, icon: ReceiptText },
    { name: ar ? "الشكاوى" : "Complaints", value: complaints.filter((x) => !["closed", "resolved", "rejected"].includes(x.status)).length, total: complaints.length, icon: MessageSquareWarning },
    { name: ar ? "المخزون" : "Inventory", value: items.filter((x) => Number(x.quantity || 0) <= Number(x.minimumStock || 0)).length, total: items.length, icon: PackageSearch },
  ];
  const trend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(); date.setDate(1); date.setMonth(date.getMonth() - 5 + index);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    return { month: new Intl.DateTimeFormat(lang, { month: "short" }).format(date), expenses: claims.filter((x) => recordMonth(x) === key).length, complaints: complaints.filter((x) => recordMonth(x) === key).length, inventory: movements.filter((x) => recordMonth(x) === key).length };
  });
  const priority = rows.reduce((highest, row) => row.value > highest.value ? row : highest, rows[0]);
  return (
    <section className="luxury-analytics overflow-hidden rounded-2xl p-5 sm:p-7">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs text-landing-gold-light">{ar ? "تحليل تشغيلي مباشر" : "Live operational analysis"}</p><h2 className="mt-1 font-heading text-2xl text-white">{ar ? "لوحة التحليل الذكية" : "Smart analytics board"}</h2></div><Sparkles className="h-5 w-5 text-landing-gold-light" /></div>
      {loading ? <div className="h-64 animate-pulse rounded-2xl bg-white/5" /> : <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]"><div className="grid gap-4">{rows.map(({ icon: Icon, ...row }) => <div key={row.name} className="holo-kpi holo-float-card flex items-center gap-4 rounded-2xl p-4"><Icon className="h-5 w-5 text-landing-gold-light" /><div className="flex-1"><p className="text-sm text-white">{row.name}</p><p className="text-xs text-white/45">{row.total} {ar ? "سجل" : "records"}</p></div><strong className="text-2xl font-light text-landing-gold-light">{row.value}</strong></div>)}<p className="flex items-center gap-2 text-sm text-white/70"><Sparkles className="h-4 w-4 text-landing-gold-light" />{priority.value ? (ar ? `الأولوية الحالية: ${priority.name}` : `Current priority: ${priority.name}`) : (ar ? "الوضع التشغيلي مستقر" : "Operations are stable")}</p></div><SmartOperationsChart data={trend} labels={{ expenses: rows[0].name, complaints: rows[1].name, inventory: rows[2].name }} /></div>}
    </section>
  );
}