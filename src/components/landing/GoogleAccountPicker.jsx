import React from "react";
import { Building2, UserRound } from "lucide-react";

export default function GoogleAccountPicker({ accounts, onSelect, onBack, loading, lang }) {
  const ar = lang === "ar";
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-heading text-2xl font-semibold text-primary">{ar ? "اختر مساحة العمل" : "Choose a workspace"}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{ar ? "حدد الحساب الذي تريد الدخول إليه" : "Select the account you want to open"}</p>
      </div>
      <div className="space-y-2">
        {accounts.map((account) => {
          const Icon = account.kind === "owner" ? Building2 : UserRound;
          return (
            <button key={account.accountKey} type="button" disabled={loading} onClick={() => onSelect(account.accountKey)} className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-4 text-start hover:bg-muted disabled:opacity-50">
              <Icon className="h-5 w-5 shrink-0 text-accent" />
              <span><strong className="block text-sm text-foreground">{account.name}</strong><small className="text-muted-foreground">{account.kind === "owner" ? (ar ? "مؤسس / مالك" : "Founder / Owner") : `${ar ? "موظف" : "Employee"}${account.employeeName ? ` — ${account.employeeName}` : ""}`}</small></span>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={onBack} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">{ar ? "رجوع" : "Back"}</button>
    </div>
  );
}