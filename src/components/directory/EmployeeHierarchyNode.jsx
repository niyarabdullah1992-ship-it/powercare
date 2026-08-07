import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { UserRound } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";

const statusStyles = { overdue: "bg-destructive/10 text-destructive", inProgress: "bg-amber-100 text-amber-800", completed: "bg-emerald-100 text-emerald-800", noTasks: "bg-muted text-muted-foreground" };
const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

export default function EmployeeHierarchyNode({ employee, company, t, ar, status }) {
  const label = { overdue: ar ? "متأخر" : "Overdue", inProgress: ar ? "نشط" : "Active", completed: ar ? "مكتمل" : "Complete", noTasks: ar ? "بلا مهام" : "No tasks" }[status];
  return <Link to={`/app/employees/${employee.id}`} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 text-start shadow-sm hover:border-accent/50 hover:shadow-md">
    {employee.profile?.avatarUrl ? <Image src={employee.profile.avatarUrl} alt={employee.name} className="h-10 w-10 shrink-0 rounded-full" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-accent">{initials(employee.name) || <UserRound className="h-4 w-4" />}</span>}
    <span className="min-w-0 flex-1"><b className="block truncate text-sm group-hover:text-accent">{employee.name}</b><span className="block truncate text-[11px] text-muted-foreground">{employee.profile?.position || employee.customTitle || getRoleLabel(company, employee.role, t)}</span></span>
    <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] ${statusStyles[status]}`}>{label}</span>
  </Link>;
}