import React, { useState } from "react";
import { Building2, ChevronDown, User } from "lucide-react";

// العرض حسب المقرات: كل مقر وموظفوه (الموقع والحضور الفعلي).
export default function StationsView({ stations, employees, query, lang }) {
  const ar = lang === "ar";
  const [open, setOpen] = useState(() => new Set());
  const q = query.trim().toLowerCase();
  const toggle = (id) => setOpen((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-3">
      {stations.map((station) => {
        const members = employees.filter((e) => e.stationId === station.id);
        const matched = q && (station.name.toLowerCase().includes(q) || members.some((m) => m.name.toLowerCase().includes(q)));
        const isOpen = open.has(station.id) || matched;
        return (
          <div key={station.id} className={`rounded-xl border bg-card ${matched ? "border-accent/50" : "border-border"}`}>
            <button onClick={() => toggle(station.id)} className="flex w-full items-center gap-3 px-4 py-3 text-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"><Building2 className="w-4 h-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-sm">{station.name}</span>
                <span className="block text-xs text-muted-foreground">{station.location || ""} · {members.length} {ar ? "موظف" : "employees"}</span>
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="border-t border-border px-4 py-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                {members.length === 0 && <p className="text-xs text-muted-foreground py-2">{ar ? "لا يوجد موظفون في هذا المقر." : "No employees at this site."}</p>}
                {members.map((m) => (
                  <div key={m.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${q && m.name.toLowerCase().includes(q) ? "bg-accent/10" : ""}`}>
                    <User className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">{m.name}</span>
                    {m.profile?.position && <span className="ms-auto truncate text-xs text-muted-foreground">{m.profile.position}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}