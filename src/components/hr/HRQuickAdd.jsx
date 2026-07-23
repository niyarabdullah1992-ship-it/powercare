import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { addHRTier } from "@/lib/store";
import HRTemplateGrid from "@/components/hr/HRTemplateGrid";
import HRPermissionToggles from "@/components/hr/HRPermissionToggles";

export default function HRQuickAdd({ companyId, lang, onClose }) {
  const ar = lang === "ar";
  const [name, setName] = useState("");
  const [scope, setScope] = useState("station");
  const [selected, setSelected] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const choose = (template) => { setSelected(template.id); setName(template.name[lang] || template.name.en); setPermissions([...template.permissions]); };
  const create = (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    addHRTier(companyId, { scope, managerName: name.trim(), includeAssistant: false, managerPermissions: permissions, stationIds: [] });
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/45 p-4" onClick={onClose}><form onSubmit={create} onClick={(event) => event.stopPropagation()} dir={ar ? "rtl" : "ltr"} className="w-full max-w-lg space-y-4 rounded-xl border border-accent/40 bg-card p-5 shadow-elevated"><div className="flex items-center justify-between"><div><h3 className="font-heading text-xl font-semibold">{ar ? "إضافة منصب سريع" : "Quick-add position"}</h3><p className="text-[11px] text-muted-foreground">{ar ? "اختر قالباً أو اكتب منصباً مخصصاً" : "Choose a template or enter a custom position"}</p></div><button type="button" onClick={onClose} className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
    <div className="grid gap-3 sm:grid-cols-[1fr_10rem]"><input autoFocus required value={name} onChange={(event) => { setName(event.target.value); setSelected(null); }} placeholder={ar ? "اسم المنصب" : "Position name"} className="rounded-md border border-input px-3 py-2 text-sm" /><select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-md border border-input px-3 py-2 text-sm"><option value="station">{ar ? "محطة" : "Station"}</option><option value="cluster">{ar ? "مجموعة" : "Cluster"}</option><option value="company">{ar ? "شركة" : "Company"}</option></select></div>
    <HRTemplateGrid selected={selected} onSelect={choose} lang={lang} />
    <div><p className="mb-2 text-xs font-semibold">{ar ? "الصلاحيات" : "Permissions"}</p><HRPermissionToggles value={permissions} onChange={setPermissions} lang={lang} /></div>
    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-md bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-md"><Plus className="h-4 w-4" />{ar ? "إنشاء الآن" : "Create now"}</button></form></div>;
}