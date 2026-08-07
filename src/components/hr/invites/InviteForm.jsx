import React, { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";

// نموذج إنشاء دعوة موظف واحدة: الاسم، الرقم الوظيفي، الجوال، والبريد (اختياري للإرسال).
export default function InviteForm({ onCreate, lang }) {
  const ar = lang === "ar";
  const [fields, setFields] = useState({ name: "", jobNumber: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setFields((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!fields.name.trim() || !fields.jobNumber.trim()) return;
    setBusy(true);
    try {
      await onCreate(fields);
      setFields({ name: "", jobNumber: "", phone: "", email: "" });
    } finally {
      setBusy(false);
    }
  };

  const labels = [
    { key: "name", label: ar ? "اسم الموظف *" : "Employee name *", type: "text" },
    { key: "jobNumber", label: ar ? "الرقم الوظيفي *" : "Job number *", type: "text" },
    { key: "phone", label: ar ? "رقم الجوال" : "Mobile number", type: "tel" },
    { key: "email", label: ar ? "البريد الإلكتروني (لإرسال الدعوة)" : "Email (to send the invite)", type: "email" },
  ];

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-4 space-y-3">
      <h3 className="font-heading font-semibold flex items-center gap-2"><UserPlus className="w-4 h-4 text-accent" />{ar ? "دعوة موظف جديد" : "Invite a new employee"}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {labels.map((f) => (
          <div key={f.key}>
            <label className="block text-xs text-muted-foreground mb-1">{f.label}</label>
            <input type={f.type} value={fields[f.key]} onChange={set(f.key)} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm" />
          </div>
        ))}
      </div>
      <button type="submit" disabled={busy || !fields.name.trim() || !fields.jobNumber.trim()} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50 flex items-center gap-2">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        {ar ? "إنشاء الدعوة (صالحة 7 أيام)" : "Create invite (valid 7 days)"}
      </button>
    </form>
  );
}