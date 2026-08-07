import React from "react";
import { Info } from "lucide-react";

export default function PayrollSalaryNotice({ ar }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-body">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
      <div>
        <p className="font-semibold text-foreground">
          {ar ? "الراتب الأساسي والبدلات مرتبطان بملف الموظف" : "Base salary and allowances are linked to the employee profile"}
        </p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          {ar
            ? "تظهر القيم تلقائيًا من ملف الموظف، وأي تعديل عليها هنا يُحفظ مباشرة في ملفه ويظل ثابتًا للأشهر القادمة حتى يغيّره قسم الموارد البشرية."
            : "Values appear automatically from the employee profile. Changes made here are saved back to the profile and remain fixed for future months until HR changes them."}
        </p>
      </div>
    </div>
  );
}