import React, { useState } from "react";
import { Plus } from "lucide-react";

const EMPTY = { direction: "incoming", subject: "", counterparty: "", summary: "", dueDate: "", ownerId: "" };

// ترتيب الحقول وفق مسار العمل: من/إلى مَن ← الموضوع ← المسؤول عن المتابعة ← المهلة.
export default function CorrespondenceForm({ lang, onCreate, employees = [] }) {
  const ar = lang === "ar";
  const [form, setForm] = useState(EMPTY);
  const internal = form.direction === "internal";

  const set = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    if (!form.subject.trim()) return;
    onCreate(form);
    setForm(EMPTY);
  };

  const field = "w-full rounded-md border border-input bg-card px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-xs font-medium text-muted-foreground";

  const partyLabel = internal
    ? (ar ? "الموظف المستلم" : "Recipient employee")
    : form.direction === "outgoing"
    ? (ar ? "الجهة المرسَل إليها" : "Recipient entity")
    : (ar ? "الجهة الواردة منها" : "Sender entity");

  const employeeSelect = (value, onChange, placeholder) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
      <option value="">{placeholder}</option>
      {employees.map((employee) => (
        <option key={employee.id} value={employee.id}>{employee.name}</option>
      ))}
    </select>
  );

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass}>{ar ? "النوع" : "Direction"}</label>
          <select value={form.direction} onChange={(e) => setForm((state) => ({ ...state, direction: e.target.value, counterparty: "", ownerId: "" }))} className={field}>
            <option value="incoming">{ar ? "وارد من جهة خارجية" : "Incoming (external)"}</option>
            <option value="outgoing">{ar ? "صادر إلى جهة خارجية" : "Outgoing (external)"}</option>
            <option value="internal">{ar ? "داخلي بين الموظفين" : "Internal (between employees)"}</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>{partyLabel}</label>
          {internal
            ? employeeSelect(form.ownerId, (id) => {
                const employee = employees.find((item) => item.id === id);
                setForm((state) => ({ ...state, ownerId: id, counterparty: employee?.name || "" }));
              }, ar ? "اختر موظفًا" : "Select an employee")
            : <input value={form.counterparty} onChange={(e) => set("counterparty", e.target.value)} placeholder={ar ? "اسم الجهة أو الشركة" : "Entity or company name"} className={field} />}
        </div>

        <div>
          <label className={labelClass}>{ar ? "الموضوع" : "Subject"}</label>
          <input value={form.subject} onChange={(e) => set("subject", e.target.value)} className={field} />
        </div>

        <div>
          <label className={labelClass}>{ar ? "المهلة النظامية" : "Statutory due date"}</label>
          <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className={field} />
        </div>
      </div>

      {!internal && (
        <div className="sm:max-w-xs">
          <label className={labelClass}>{ar ? "المسؤول عن المتابعة" : "Responsible employee"}</label>
          {employeeSelect(form.ownerId, (id) => set("ownerId", id), ar ? "أنا (منشئ المعاملة)" : "Me (creator)")}
        </div>
      )}

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