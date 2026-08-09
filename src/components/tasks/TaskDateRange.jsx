import React from "react";

const toISO = (d) => d.toISOString().slice(0, 10);

// تاريخ بداية ونهاية فقط، مع اختصارات سريعة تملأ التاريخين.
export default function TaskDateRange({ start, end, setStart, setEnd, lang }) {
  const ar = lang === "ar";
  const shortcuts = [
    { key: "week", label: ar ? "أسبوع" : "Week", days: 7 },
    { key: "month", label: ar ? "شهر" : "Month", days: 30 },
    { key: "quarter", label: ar ? "ربع" : "Quarter", days: 90 },
  ];

  const apply = (days) => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);
    setStart(toISO(from));
    setEnd(toISO(to));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">{ar ? "من" : "From"}</span>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm font-body" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted-foreground">{ar ? "إلى" : "To"}</span>
          <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm font-body" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) => (
          <button key={s.key} type="button" onClick={() => apply(s.days)} className="rounded-full border border-border px-3 py-1 text-xs font-body hover:bg-muted">
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}