import React, { useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";
import { renameCompany } from "@/lib/companySettings";
import { toast } from "@/components/ui/use-toast";

export default function CompanyNameEditor({ company, data, currentUser, lang, compact = false }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(company.name || "");
  const [saving, setSaving] = useState(false);
  const isOwner = currentUser?.id === data?.ownerId;

  const save = async (event) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName || nextName === company.name) { setOpen(false); return; }
    setSaving(true);
    const saved = await renameCompany(company.id, nextName);
    setSaving(false);
    if (saved) {
      setOpen(false);
      toast({ title: lang === "ar" ? "تم تحديث اسم الشركة" : "Company name updated" });
    } else {
      toast({ variant: "destructive", title: lang === "ar" ? "تعذّر حفظ الاسم" : "Couldn't save the name" });
    }
  };

  return (
    <div className={`relative min-w-0 ${compact ? "max-w-[150px]" : "max-w-sm"}`}>
      <button type="button" disabled={!isOwner} onClick={() => { setName(company.name || ""); setOpen(true); }} className="flex max-w-full items-center gap-2 rounded-lg text-start disabled:cursor-default">
        <span className={`truncate font-heading font-semibold ${compact ? "text-sm" : "text-lg"}`}>{company.name || (lang === "ar" ? "اسم الشركة" : "Company name")}</span>
        {isOwner && <Pencil className="h-3.5 w-3.5 shrink-0 text-accent" />}
      </button>
      {open && <form onSubmit={save} className="absolute start-0 top-full z-50 mt-3 w-72 rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">{lang === "ar" ? "تغيير اسم الشركة" : "Change company name"}</p><button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button></div>
        <input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={120} className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button disabled={saving || !name.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{lang === "ar" ? "حفظ الاسم" : "Save name"}</button>
      </form>}
    </div>
  );
}