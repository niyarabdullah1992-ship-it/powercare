import React from "react";
import { Link } from "react-router-dom";
import { Briefcase, Mail, MapPin, Phone, Trophy } from "lucide-react";
import { Image } from "@/components/ui/image";
import { badgeFor } from "@/lib/rewards";
import { employeeJobGrade, jobGradeLabel } from "@/lib/jobGrades";
import { getRoleLabel } from "@/lib/roles";

const COLORS = ["bg-sky-700", "bg-emerald-700", "bg-violet-700", "bg-amber-700", "bg-rose-700", "bg-teal-700"];
const STATUS_STYLES = { overdue: "border-red-200 bg-red-50 text-red-700", inProgress: "border-amber-200 bg-amber-50 text-amber-700", completed: "border-emerald-200 bg-emerald-50 text-emerald-700", noTasks: "border-border bg-muted text-muted-foreground" };
const initials = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]).join("").toUpperCase();
const colorFor = (id) => COLORS[[...String(id || "")].reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length];

export default function EmployeeDirectoryCard({ employee, station, data, company, t, ar, taskStatus }) {
  const grade = employeeJobGrade(employee, data);
  const badge = badgeFor(employee.points || 0);
  const statusLabel = { overdue: ar ? "مهام متأخرة" : "Overdue tasks", inProgress: ar ? "مهام نشطة" : "Active tasks", completed: ar ? "المهام مكتملة" : "Tasks completed", noTasks: ar ? "لا توجد مهام" : "No tasks" }[taskStatus];
  return <Link to={`/app/employees/${employee.id}`} className="group block min-w-0 border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md">
    <div className="flex flex-col items-center text-center">{employee.profile?.avatarUrl ? <Image src={employee.profile.avatarUrl} alt={employee.name} className="h-20 w-20 rounded-md" /> : <div className={`flex h-20 w-20 items-center justify-center rounded-md text-2xl font-bold text-white ${colorFor(employee.id)}`}>{initials(employee.name)}</div>}<p className="mt-2 text-xs font-bold tracking-[.18em] text-muted-foreground">{initials(employee.name)}</p><h3 className="mt-1 truncate font-heading text-lg font-semibold group-hover:text-accent">{employee.name}</h3><p className="min-h-5 text-xs text-muted-foreground">{employee.profile?.position || employee.customTitle || getRoleLabel(company, employee.role, t)}</p></div>
    <div className="mt-4 flex flex-wrap justify-center gap-1.5"><span className="rounded-sm bg-secondary px-2 py-1 text-[10px] font-semibold text-secondary-foreground">{getRoleLabel(company, employee.role, t)}</span>{grade && <span className="rounded-sm border border-accent/30 px-2 py-1 text-[10px] text-accent">{jobGradeLabel(grade)}</span>}<span className={`rounded-sm border px-2 py-1 text-[10px] ${STATUS_STYLES[taskStatus]}`}>{statusLabel}</span></div>
    <div className="mt-4 space-y-2 border-t border-border pt-3 text-xs text-muted-foreground"><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{station?.name || "—"}</span></p>{employee.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate" dir="ltr">{employee.email}</span></p>}{employee.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /><span dir="ltr">{employee.phone}</span></p>}<p className="flex items-center justify-between"><span className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" />{ar ? "الدرجة" : "Grade"}: {grade ? grade.gradeNumber : "—"}</span><span className="flex items-center gap-1 text-foreground"><Trophy className="h-3.5 w-3.5 text-accent" />{employee.points || 0} · {badge.icon}</span></p></div>
  </Link>;
}