import React from "react";
import { Clock3, ShieldCheck, UserCheck, Users, WalletCards } from "lucide-react";
import { HR_ROLE_TEMPLATES } from "@/lib/hrRoleTemplates";

const ICONS = { clock: Clock3, shield: ShieldCheck, wallet: WalletCards, users: Users, "user-check": UserCheck };

export default function HRTemplateGrid({ selected, onSelect, lang }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{HR_ROLE_TEMPLATES.map((template) => {
    const Icon = ICONS[template.icon];
    return <button key={template.id} type="button" onClick={() => onSelect(template)} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-lg border p-2 text-center text-xs font-semibold ${selected === template.id ? "border-accent bg-accent/15 text-foreground" : "border-border bg-muted/30 text-muted-foreground hover:border-accent/50"}`}><Icon className="h-4 w-4 text-accent" />{template.name[lang] || template.name.en}</button>;
  })}</div>;
}