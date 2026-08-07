import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";

// مصادر بيانات المسير — كل شريحة تفتح القسم الذي غذّى الأرقام.
export default function PayrollSourceChips({ ar }) {
  const sources = [
    { to: "/app/attendance", ar: "من سجل الحضور", en: "From attendance" },
    { to: "/app/tasks", ar: "بدلات من المهام", en: "Allowances from tasks" },
    { to: "/app/expenses", ar: "مطالبات المصروفات", en: "Expense claims" },
    { to: "/app/signing", ar: "يُختم بإثباتات التنفيذ", en: "Sealed with execution proof" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-muted-foreground">{ar ? "مصادر هذا المسير:" : "Sources for this run:"}</span>
      {sources.map((source) => (
        <Link key={source.to} to={source.to} className="flex items-center gap-1.5 rounded-full border border-accent/35 bg-accent/5 px-3 py-1.5 text-[11px] font-semibold text-accent-text hover:bg-accent/10">
          {ar ? source.ar : source.en}
          <ArrowUpLeft className="h-3 w-3" strokeWidth={2} />
        </Link>
      ))}
    </div>
  );
}