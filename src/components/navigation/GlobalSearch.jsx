import React, { useEffect, useMemo, useState } from "react";
import { Search, Users, Radio, CornerDownLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SearchResults from "@/components/navigation/SearchResults";
import { visibleEmployees, visibleStations } from "@/lib/permissions";

export default function GlobalSearch({ open, onClose, items, data, currentUser, lang }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => { if (open) setQuery(""); }, [open]);
  const results = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    if (!text) return items.map((item) => ({ id: item.to, type: "page", label: item.label, subtitle: lang === "ar" ? "قسم" : "Section", icon: item.icon, to: item.to })).slice(0, 8);
    const pages = items.filter((item) => item.label.toLocaleLowerCase().includes(text)).map((item) => ({ id: item.to, type: "page", label: item.label, subtitle: lang === "ar" ? "قسم" : "Section", icon: item.icon, to: item.to }));
    const employeeScope = items.some((item) => item.to === "/app/employees") ? visibleEmployees(currentUser, data) : [currentUser];
    const employees = employeeScope.filter((employee) => employee.name?.toLocaleLowerCase().includes(text)).map((employee) => ({ id: employee.id, type: "employee", label: employee.name, subtitle: lang === "ar" ? "موظف" : "Employee", icon: Users, to: `/app/employees/${employee.id}` }));
    const stations = visibleStations(currentUser, data).filter((station) => station.name?.toLocaleLowerCase().includes(text)).map((station) => ({ id: station.id, type: "station", label: station.name, subtitle: lang === "ar" ? "محطة" : "Station", icon: Radio, to: `/app/stations?station=${station.id}` }));
    return [...pages, ...employees, ...stations].slice(0, 12);
  }, [query, items, data, lang, currentUser.id]);
  if (!open) return null;
  const select = (result) => { navigate(result.to); onClose(); };
  return <div className="fixed inset-0 z-[80] flex items-start justify-center bg-foreground/35 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
      <div className="flex items-center gap-3 border-b border-border px-4"><Search className="h-5 w-5 text-accent" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={lang === "ar" ? "ابحث عن قسم أو موظف أو محطة..." : "Search sections, employees or stations..."} className="h-14 flex-1 border-0 bg-transparent text-sm outline-none ring-0 focus-visible:ring-0" /><kbd className="rounded border border-border bg-muted px-2 py-1 text-[10px] text-muted-foreground">Esc</kbd></div>
      <SearchResults results={results} onSelect={select} lang={lang} />
      <div className="flex items-center gap-2 border-t border-border px-4 py-2 text-[10px] text-muted-foreground"><CornerDownLeft className="h-3 w-3" />{lang === "ar" ? "اختر نتيجة للانتقال" : "Select a result to open"}</div>
    </div>
  </div>;
}