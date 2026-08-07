import React from "react";
import { Briefcase, User } from "lucide-react";

// العرض حسب المسميات الوظيفية: تجميع الموظفين تحت كل مسمى.
export default function TitlesView({ employees, smartPositions, query, lang }) {
  const ar = lang === "ar";
  const q = query.trim().toLowerCase();
  const titleFor = (employee) =>
    employee.profile?.position ||
    smartPositions.find((p) => p.employeeId === employee.id)?.title ||
    (ar ? "بدون مسمى" : "No title");
  const groups = new Map();
  for (const employee of employees) {
    const key = titleFor(employee);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(employee);
  }
  const entries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {entries.map(([title, members]) => {
        const matched = q && (title.toLowerCase().includes(q) || members.some((m) => m.name.toLowerCase().includes(q)));
        return (
          <div key={title} className={`rounded-xl border bg-card p-4 ${matched ? "border-accent/50" : "border-border"}`}>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-4 h-4 text-accent" />
              <h4 className="font-heading font-semibold text-sm flex-1 truncate">{title}</h4>
              <span className="text-xs text-muted-foreground">{members.length}</span>
            </div>
            <div className="space-y-1">
              {members.map((m) => (
                <div key={m.id} className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${q && m.name.toLowerCase().includes(q) ? "bg-accent/10" : ""}`}>
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{m.name}</span>
                  {m.profile?.jobGrade && <span className="ms-auto text-xs text-muted-foreground">{m.profile.jobGrade}</span>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}