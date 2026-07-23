import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Image } from "@/components/ui/image";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import HROrgInlineAdd from "@/components/hr/HROrgInlineAdd";
import { updateCompany } from "@/lib/store";

const roleLabel = (role, ar) => ({ owner: ar ? "مالك" : "Owner", manager: ar ? "مدير" : "Manager", hr: ar ? "موارد بشرية" : "HR", employee: ar ? "موظف" : "Employee" }[role] || role || (ar ? "موظف" : "Employee"));

export default function HROrgEmployeeNode({ employee, station, ar, companyId, canManage }) {
  const [adding, setAdding] = useState(false);
  const position = employee.profile?.position || employee.position || roleLabel(employee.role, ar);
  const avatar = employee.profile?.avatarUrl;
  const addEmployee = ({ name, position: nextPosition }) => {
    const id = `emp_${Math.random().toString(36).slice(2, 9)}`;
    updateCompany(companyId, (draft) => draft.employees.push({ id, name, position: nextPosition, stationId: station.id, directManagerId: employee.id, role: "employee", email: "", phone: "", anonymousId: `ANON_${Math.random().toString(36).slice(2, 9)}`, profile: { position: nextPosition, directManagerId: employee.id }, managedStations: [], createdAt: new Date().toISOString() }));
    setAdding(false);
  };
  return (
    <div className="group/node relative w-44">
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full rounded-lg border border-accent/25 bg-card p-2.5 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-md">
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
    {canManage && <button type="button" onClick={() => setAdding(true)} aria-label={ar ? "إضافة موظف" : "Add employee"} className="absolute -end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground opacity-0 shadow-md transition-opacity hover:brightness-105 focus:opacity-100 group-hover/node:opacity-100"><Plus className="h-3.5 w-3.5" /></button>}
    {adding && <HROrgInlineAdd ar={ar} onSave={addEmployee} onCancel={() => setAdding(false)} />}
    </div>
  );
}