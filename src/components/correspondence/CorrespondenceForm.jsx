import React, { useState } from "react";
import { Plus } from "lucide-react";

export default function CorrespondenceForm({ lang, onCreate }) {
  const ar = lang === "ar";
  const [form, setForm] = useState({ direction: "incoming", subject: "", counterparty: "", summary: "", dueDate: "" });

  const set = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.subject.trim()) return;
    onCreate(form);
    setForm({ direction: "incoming", subject: "", counterparty: "", summary: "", dueDate: "" });
  };

  const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>{ar ? "النوع" : "Direction"}</label>
          <select value={form.direction} onChange={(e) => set("direction", e.target.value)} className={field}>
            <option value="incoming">{ar ? "وارد" : "Incoming"}</option>
            <option value="outgoing">{ar ? "صادر" : "Outgoing"}</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>{ar ? "الموضوع" : "Subject"}</label>
          <input value={form.subject} onChange={(e) => set("subject", e.target.value)} className={field} />
        </div>
        <div>
          <label className={labelClass}>{ar ? "الجهة" : "Counterparty"}</label>
          <input value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} className={field} />
        </div>
        <div>
          <label className={labelClass}>{ar ? "المهلة النظامية" : "Statutory due date"}</label>
          <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={field} />
        </div>
      </div>
      <div>
        <label className={labelClass}>{ar ? "الملخص" : "Summary"}</label>
        <textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={2} className={field} />
      </div>
      <button type="submit" className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
        <Plus className="h-4 w-4" />{ar ? "تسجيل المعاملة" : "Register correspondence"}
      </button>
    </form>
  );
}