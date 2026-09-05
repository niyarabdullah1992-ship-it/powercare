import React from "react";
import { PLAN_SECTIONS, PLAN_FEATURES } from "@/lib/subscriptionPlans";

export default function PlanEntitlementsFields({ value, onChange, ar }) {
  const toggle = (field, key) => {
    const current = new Set(value[field] || []);
    current.has(key) ? current.delete(key) : current.add(key);
    onChange({ ...value, [field]: [...current] });
  };
  const limit = (field, input) => onChange({ ...value, [field]: input === "" ? null : Math.max(1, Number(input)) });
  return <div className="space-y-4 rounded-lg border border-border bg-muted/35 p-4 md:col-span-2">
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">{ar ? "الحد الأقصى للفروع" : "Maximum stations"}<input type="number" min="1" value={value.maxStations ?? ""} onChange={(e) => limit("maxStations", e.target.value)} placeholder={ar ? "غير محدود" : "Unlimited"} className="mt-1 w-full rounded-md border border-input px-3 py-2" /></label>
      <label className="text-sm">{ar ? "الحد الأقصى للموظفين" : "Maximum employees"}<input type="number" min="1" value={value.maxEmployees ?? ""} onChange={(e) => limit("maxEmployees", e.target.value)} placeholder={ar ? "غير محدود" : "Unlimited"} className="mt-1 w-full rounded-md border border-input px-3 py-2" /></label>
    </div>
    <div><p className="mb-2 text-sm font-semibold">{ar ? "الأقسام المتاحة" : "Available sections"}</p><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{PLAN_SECTIONS.map((item) => <label key={item.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(value.enabledSections || []).includes(item.key)} onChange={() => toggle("enabledSections", item.key)} />{ar ? item.ar : item.en}</label>)}</div></div>
    <div><p className="mb-2 text-sm font-semibold">{ar ? "المزايا الخاصة" : "Premium features"}</p><div className="flex flex-wrap gap-4">{PLAN_FEATURES.map((item) => <label key={item.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={(value.enabledFeatures || []).includes(item.key)} onChange={() => toggle("enabledFeatures", item.key)} />{ar ? item.ar : item.en}</label>)}</div></div>
  </div>;
}