import React, { useState } from "react";
import { Mail, Plus, X } from "lucide-react";
import { updateCompany } from "@/lib/store";

export default function AllowedEmailList({ companyId, emails = [], lang }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const ar = lang === "ar";
  const save = (next) => updateCompany(companyId, (data) => {
    data.settings = data.settings || {};
    data.settings.allowedEmails = next;
  });
  const add = () => {
    const email = value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError(ar ? "أدخل بريدًا إلكترونيًا صحيحًا." : "Enter a valid email address.");
    if (emails.some((item) => item.toLowerCase() === email)) return setError(ar ? "البريد مضاف مسبقًا." : "Email already added.");
    save([...emails, email]);
    setValue("");
    setError("");
  };
  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div><h4 className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-accent" />{ar ? "الإيميلات المسموح بها" : "Allowed email addresses"}</h4><p className="mt-1 text-[11px] text-muted-foreground">{ar ? "يمكن إضافة الموظفين بهذه الإيميلات فقط. اترك القائمة فارغة للسماح بأي إيميل." : "Only these email addresses can be added as employees. Leave empty to allow any email."}</p></div>
      <div className="flex gap-2"><input type="email" value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="name@company.com" className="min-w-0 flex-1 rounded-md border border-input px-3 py-2 text-sm" /><button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs text-background"><Plus className="h-3.5 w-3.5" />{ar ? "إضافة" : "Add"}</button></div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-2">{emails.map((email) => <span key={email} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-xs"><span dir="ltr">{email}</span><button type="button" onClick={() => save(emails.filter((item) => item !== email))} className="text-muted-foreground hover:text-destructive" aria-label={ar ? "حذف البريد" : "Remove email"}><X className="h-3 w-3" /></button></span>)}</div>
    </div>
  );
}