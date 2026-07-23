import React from "react";
import { Image } from "@/components/ui/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const roleLabel = (role, ar) => ({ owner: ar ? "مالك" : "Owner", manager: ar ? "مدير" : "Manager", hr: ar ? "موارد بشرية" : "HR", employee: ar ? "موظف" : "Employee" }[role] || role || (ar ? "موظف" : "Employee"));

export default function HROrgEmployeeNode({ employee, station, ar }) {
  const position = employee.profile?.position || employee.position || roleLabel(employee.role, ar);
  const avatar = employee.profile?.avatarUrl;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-44 rounded-lg border border-accent/25 bg-card p-2.5 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xs font-semibold text-primary-foreground ring-1 ring-accent/40">{avatar ? <Image src={avatar} alt={employee.name} fittingType="fill" className="h-full w-full" /> : employee.name?.charAt(0) || "?"}</span>
            <span className="min-w-0"><span className="block truncate text-xs font-semibold">{employee.name}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{position}</span></span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 border-accent/30" dir={ar ? "rtl" : "ltr"}>
        <p className="font-heading text-lg font-semibold">{employee.name}</p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs"><dt className="text-muted-foreground">{ar ? "المنصب" : "Position"}</dt><dd>{position}</dd><dt className="text-muted-foreground">{ar ? "المحطة" : "Station"}</dt><dd>{station?.name || "—"}</dd><dt className="text-muted-foreground">{ar ? "الدور" : "Role"}</dt><dd>{roleLabel(employee.role, ar)}</dd></dl>
      </PopoverContent>
    </Popover>
  );
}