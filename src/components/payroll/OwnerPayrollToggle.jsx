import React from "react";
import { Switch } from "@/components/ui/switch";

export default function OwnerPayrollToggle({ checked, onChange, ar }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="text-sm font-semibold">{ar ? "إدراج المالك في مسير الرواتب" : "Include owner in payroll"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{ar ? "إعداد ثابت، وراتب المالك اختياري وغير إلزامي." : "Persistent setting; the owner's salary is optional."}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={ar ? "إدراج المالك في الرواتب" : "Include owner in payroll"} />
    </div>
  );
}