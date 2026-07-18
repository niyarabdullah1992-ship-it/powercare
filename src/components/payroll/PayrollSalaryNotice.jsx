import React from "react";
import { Info } from "lucide-react";

export default function PayrollSalaryNotice({ ar }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-accent/20 bg-accent/10 p-4 text-sm font-body">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={1.75} />
      <div>
        <p className="font-semibold text-foreground">
          {ar ? "الراتب الأساسي ثابت في مسير الرواتب" : "Base salary is fixed in payroll"}
        </p>
        <p className="mt-1 leading-relaxed text-muted-foreground">
          {ar
            ? "يُسحب الراتب الأساسي تلقائيًا من الملف الشخصي للموظف. لتغييره، افتح ملف الموظف ثم تبويب «الراتب» واحفظ التعديل؛ وسيُحدَّث مسير الشهر الحالي تلقائيًا."
            : "Base salary is pulled automatically from the employee profile. To change it, open the employee profile, select the Salary tab, and save; the current payroll run will update automatically."}
        </p>
      </div>
    </div>
  );
}