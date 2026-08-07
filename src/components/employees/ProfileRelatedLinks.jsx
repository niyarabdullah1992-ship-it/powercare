import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpLeft } from "lucide-react";

// السجلات المرتبطة بالموظف — روابط سريعة إلى أقسام النظام الأخرى.
export default function ProfileRelatedLinks({ ar }) {
  const links = [
    { to: "/app/tasks", label: ar ? "مهام هذا الموظف" : "Tasks" },
    { to: "/app/attendance", label: ar ? "سجل حضوره" : "Attendance" },
    { to: "/app/performance", label: ar ? "تقييم أدائه" : "Performance" },
    { to: "/app/payroll", label: ar ? "بند راتبه في المسير" : "Payroll line" },
    { to: "/app/chain", label: ar ? "موقعه في الهيكل" : "Org position" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4">
      <span className="me-1 text-xs text-muted-foreground">{ar ? "سجلاته المرتبطة:" : "Related records:"}</span>
      {links.map((link) => (
        <Link key={link.to} to={link.to} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-accent/60 hover:bg-accent/5">
          {link.label} <ArrowUpLeft className="h-3 w-3 text-accent" />
        </Link>
      ))}
    </div>
  );
}