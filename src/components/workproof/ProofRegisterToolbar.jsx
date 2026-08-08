import React from "react";
import { Plus, Search } from "lucide-react";

// Register toolbar: free search across the proof's real field data + status filters.
export default function ProofRegisterToolbar({ ar, query, onQuery, status, onStatus, counts, total, onNew }) {
  const filters = [
    { key: "all", label: ar ? "الكل" : "All" },
    { key: "in_progress", label: ar ? "قيد التنفيذ" : "In progress" },
    { key: "pending_signature", label: ar ? "بانتظار توقيع العميل" : "Awaiting signature" },
    { key: "signed", label: ar ? "موثّق بتوقيع العميل" : "Client sealed" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={ar ? "ابحث بعنوان العمل، أو اسم عامل، أو رقم هوية، أو رقم لوحة…" : "Search by work title, crew name, ID number or plate…"}
            className="w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm font-body ps-9"
          />
        </div>
        <button onClick={onNew} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" />{ar ? "فتح مهمة" : "Open job"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onStatus(filter.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-body ${status === filter.key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
          >
            {filter.label}{counts[filter.key] != null ? ` · ${counts[filter.key]}` : ""}
          </button>
        ))}
        <span className="ms-auto text-[11px] text-muted-foreground font-body">{ar ? `${total} نتيجة` : `${total} results`}</span>
      </div>
    </div>
  );
}