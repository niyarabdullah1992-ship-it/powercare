import React from "react";
import { Info } from "lucide-react";
import { ACCENT, MUTED, NAVY, BRAND_SOFT, BRAND_BORDER } from "@/lib/platformStyles";

export default function PayrollSalaryNotice({ ar }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
      borderRadius: "13px",
      border: `1px solid ${BRAND_BORDER}`,
      background: BRAND_SOFT,
      padding: "14px 16px",
      fontSize: "13px",
    }}>
      <Info style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0, color: ACCENT }} strokeWidth={1.75} />
      <div>
        <p style={{ margin: 0, fontWeight: 600, color: NAVY }}>
          {ar ? "الراتب الأساسي والبدلات مرتبطان بملف الموظف" : "Base salary and allowances are linked to the employee profile"}
        </p>
        <p style={{ margin: "6px 0 0", lineHeight: 1.7, color: MUTED }}>
          {ar
            ? "تظهر القيم تلقائيًا من ملف الموظف، وأي تعديل عليها هنا يُحفظ مباشرة في ملفه ويظل ثابتًا للأشهر القادمة حتى يغيّره قسم الموارد البشرية."
            : "Values appear automatically from the employee profile. Changes made here are saved back to the profile and remain fixed for future months until HR changes them."}
        </p>
      </div>
    </div>
  );
}
