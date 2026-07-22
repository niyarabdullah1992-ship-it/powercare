import React from "react";
import { Search } from "lucide-react";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function DirectoryFilters({ search, onSearch, role, onRole, grade, onGrade, station, onStation, roles, grades, stations, ar }) {
  return <div className="grid grid-cols-1 gap-3 overflow-hidden rounded-lg border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(0,1fr))]">
    <div className="relative min-w-0"><Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={ar ? "بحث بالاسم أو البريد" : "Search name or email"} className="w-full rounded-md border border-input py-2 ps-9 pe-3 text-sm" /></div>
    <MobileSelect value={role} onChange={onRole} options={roles} placeholder={ar ? "كل الأدوار" : "All roles"} className="w-full min-w-0" />
    <MobileSelect value={grade} onChange={onGrade} options={grades} placeholder={ar ? "كل الدرجات" : "All grades"} className="w-full min-w-0" />
    <MobileSelect value={station} onChange={onStation} options={stations} placeholder={ar ? "كل المحطات" : "All stations"} className="w-full min-w-0" />
  </div>;
}