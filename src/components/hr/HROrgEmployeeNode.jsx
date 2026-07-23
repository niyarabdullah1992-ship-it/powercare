import React from "react";
import { Image } from "@/components/ui/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const roleLabel = (role, ar) => ({ owner: ar ? "مالك" : "Owner", manager: ar ? "مدير" : "Manager", hr: ar ? "موارد بشرية" : "HR", employee: ar ? "موظف" : "Employee" }[role] || role || (ar ? "موظف" : "Employee"));

export default function HROrgEmployeeNode({ employee, station, ar, title, variant = "employee", compact = false }) {
  const position = title || employee.profile?.position || employee.position || roleLabel(employee.role, ar);
  const avatar = employee.profile?.avatarUrl;
  const styles = variant === "owner" ? "w-64 border-2 border-accent bg-primary p-4 text-primary-foreground shadow-elevated" : variant === "manager" ? "w-52 border-accent/55 bg-accent/15 p-3 shadow-md" : variant === "assistant" ? "w-48 border-accent/35 bg-card p-3 shadow-sm" : "w-full border-border bg-muted/35 p-2";
  return <Popover><PopoverTrigger asChild><button data-org-node type="button" onClick={(event) => event.stopPropagation()} className={`rounded-lg border text-start transition hover:-translate-y-0.5 hover:border-accent/70 hover:shadow-md ${styles}`}>
    <span className="flex items-center gap-2.5"><span className={`${compact ? "h-7 w-7" : "h-9 w-9"} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-accent/40`}>{avatar ? <Image src={avatar} alt={employee.name} fittingType="fill" className="h-full w-full" /> : employee.name?.charAt(0) || "?"}</span><span className="min-w-0"><span className={`${compact ? "text-[11px]" : "text-xs"} block truncate font-semibold`}>{employee.name}</span><span className={`mt-0.5 block truncate text-[10px] ${variant === "owner" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{position}</span></span></span>
  </button></PopoverTrigger><PopoverContent side="top" className="w-64 border-accent/30" dir={ar ? "rtl" : "ltr"}><p className="font-heading text-lg font-semibold">{employee.name}</p><dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-muted-foreground">{ar ? "المنصب" : "Position"}</dt><dd>{position}</dd><dt className="text-muted-foreground">{ar ? "الدور" : "Role"}</dt><dd>{roleLabel(employee.role, ar)}</dd><dt className="text-muted-foreground">{ar ? "المحطة" : "Station"}</dt><dd>{station?.name || (ar ? "على مستوى الشركة" : "Company-wide")}</dd></dl></PopoverContent></Popover>;
}