import React from "react";
import { Search } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function DirectoryFilters({ search, onSearch, role, onRole, grade, onGrade, station, onStation, roles, grades, stations, ar }) {
  return <div className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,auto))]">
    <div className="relative"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={ar ? "بحث بالاسم أو البريد" : "Search name or email"} className="w-full rounded-md border border-input py-2 ps-9 pe-3 text-sm" /></div>
    <MobileSelect value={role} onChange={onRole} options={roles} placeholder={ar ? "كل الأدوار" : "All roles"} />
    <MobileSelect value={grade} onChange={onGrade} options={grades} placeholder={ar ? "كل الدرجات" : "All grades"} />
    <MobileSelect value={station} onChange={onStation} options={stations} placeholder={ar ? "كل المحطات" : "All stations"} />
  </div>;
}