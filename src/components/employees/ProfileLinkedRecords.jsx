import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";

// «سجلاته المرتبطة» — روابط سريعة لسجلات الموظف عبر أقسام المنصة.
export default function ProfileLinkedRecords({ ar, showPayroll }) {
  const Arrow = ar ? ArrowUpLeft : ArrowUpRight;
  const links = [
    { to: "/app/tasks", label: ar ? "مهام هذا الموظف" : "Employee tasks" },
    { to: "/app/attendance", label: ar ? "سجل حضوره" : "Attendance record" },
    { to: "/app/performance", label: ar ? "تقييم أدائه" : "Performance review" },
    ...(showPayroll ? [{ to: "/app/payroll", label: ar ? "بند راتبه في المسير" : "Payroll entry" }] : []),
    { to: "/app/hr", label: ar ? "موقعه في الهيكل" : "Org chart position" },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 px-4">
      <span className="text-xs font-medium text-muted-foreground">{ar ? "سجلاته المرتبطة:" : "Linked records:"}</span>
      {links.map((link) => (
        <Link key={link.to} to={link.to} className="flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:border-accent/50 hover:text-accent-text">
          {link.label} <Arrow className="h-3 w-3 text-accent" />
        </Link>
      ))}
    </div>
  );
}