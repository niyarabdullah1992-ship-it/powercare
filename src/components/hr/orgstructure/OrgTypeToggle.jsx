import React from "react";
import { Building2, Landmark } from "lucide-react";
import { updateCompany, logAudit } from "@/lib/store";
import { getOrgType } from "@/lib/orgTerms";

// اختيار نوع الجهة — يغيّر مصطلحات المنظومة كاملة.
export default function OrgTypeToggle({ companyId, data, lang }) {
  const ar = lang === "ar";
  const current = getOrgType(data);

  const setType = (type) => {
    if (type === current) return;
    updateCompany(companyId, (d) => { d.orgType = type; });
    logAudit(companyId, "org_type_changed", `Organization type set to ${type}.`);
  };

  const options = [
    { id: "company", icon: Building2, label: ar ? "شركة" : "Company" },
    { id: "gov", icon: Landmark, label: ar ? "جهة حكومية" : "Government entity" },
  ];

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => setType(option.id)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium ${current === option.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          <option.icon className="h-4 w-4" />
          {option.label}
        </button>
      ))}
    </div>
  );
}