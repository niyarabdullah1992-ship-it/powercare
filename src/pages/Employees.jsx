import React, { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { getRoleLabel } from "@/lib/roles";
import PageHeader from "@/components/PageHeader";
import EmployeeDirectoryTable from "@/components/employees/EmployeeDirectoryTable";

export default function Employees() {
  const { data, company } = useAuth();
  const { t, lang, dir } = useI18n();
  const ar = lang === "ar";
  const [stationId, setStationId] = useState("all");
  const [query, setQuery] = useState("");

  const stations = data?.stations || [];
  const employees = data?.employees || [];
  const roleLabel = (role) => getRoleLabel(company, role, t);
  const stationName = (id) => stations.find((station) => station.id === id)?.name || "—";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((employee) => {
      if (stationId !== "all" && employee.stationId !== stationId) return false;
      if (!q) return true;
      return [employee.name, employee.email, employee.phone, employee.profile?.position, employee.position, roleLabel(employee.role), stationName(employee.stationId)]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
    });
  }, [employees, stationId, query, stations]);

  const chips = [{ id: "all", name: ar ? "كل المحطات" : "All stations" }, ...stations];

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "الموظفون" : "Employees"}
        description={ar ? "اختر محطة أو كل المحطات، ثم اضغط على أي موظف للانتقال إلى ملفه الشخصي." : "Pick a station or all stations, then tap any employee to open their profile."}
        icon={Users}
      />

      <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 py-0.5">
        {chips.map((station) => (
          <button
            key={station.id}
            onClick={() => setStationId(station.id)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight ${stationId === station.id ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:bg-muted"}`}
          >
            {station.name}
            <span className="ms-1 opacity-70">{station.id === "all" ? employees.length : employees.filter((e) => e.stationId === station.id).length}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={ar ? "ابحث بالاسم أو المسمى أو البريد…" : "Search by name, position or email…"}
          className="w-full rounded-md border border-input py-2.5 pe-3 ps-9 text-sm font-body"
        />
      </div>

      <p className="text-xs text-muted-foreground font-body">{ar ? `${visible.length} موظف` : `${visible.length} employees`}</p>

      <EmployeeDirectoryTable employees={visible} stationName={stationName} roleLabel={roleLabel} ar={ar} dir={dir} />
    </div>
  );
}