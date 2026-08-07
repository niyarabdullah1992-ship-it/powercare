import React from "react";
import { Briefcase } from "lucide-react";

// يعرض عملاء المهام المكتملة داخل الفترة، لاختيار عميل واحد وإصدار إثباته.
export default function ProofClientFilter({ clients, value, onChange, ar }) {
  if (clients.length === 0) return null;
  const options = [{ id: "all", label: ar ? "كل المهام" : "All tasks" }, ...clients.map((name) => ({ id: name, label: name }))];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Briefcase className="h-4 w-4 text-muted-foreground" />
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`min-h-[40px] rounded-lg border px-3.5 text-sm font-body ${value === option.id ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}