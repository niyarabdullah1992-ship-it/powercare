import React from "react";
import { FileSpreadsheet, Download } from "lucide-react";
import { downloadPayrollTemplate } from "@/lib/payrollTemplate";

// Excel-does-everything flow: download a template pre-filled with all employees,
// edit amounts in Excel, then upload it back via the smart import next to it.
export default function PayrollTemplateCard({ data, month, ar }) {
  const steps = ar
    ? ["نزّل القالب — فيه كل موظفيك ورواتبهم الحالية", "عدّل المبالغ في إكسل واحفظ الملف", "ارفعه في «الاستيراد الذكي» بجانب هذه البطاقة — يُطبَّق كل شيء تلقائيًا"]
    : ["Download the template — pre-filled with all your employees", "Edit the amounts in Excel and save", "Upload it in “Smart import” next to this card — everything applies automatically"];

  return (
    <div className="rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 p-4 md:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="font-heading font-semibold text-sm">{ar ? "قالب إكسل جاهز" : "Ready Excel template"}</h3>
            <p className="text-[11px] text-muted-foreground font-body">
              {ar ? "الإكسل يقوم بكل شيء: نزّل، عبّئ، ارفع" : "Excel does everything: download, fill, upload"}
            </p>
          </div>
        </div>
        <button
          onClick={() => downloadPayrollTemplate(data, month, ar)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 text-white text-sm font-body font-medium hover:opacity-90"
        >
          <Download className="w-4 h-4" strokeWidth={1.75} /> {ar ? "تنزيل القالب" : "Download template"}
        </button>
      </div>
      <ol className="space-y-1.5">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground font-body">
            <span className="min-w-[18px] h-[18px] rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-semibold flex items-center justify-center mt-px">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}