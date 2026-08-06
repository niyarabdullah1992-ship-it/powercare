import React from "react";
import { Scale, AlertTriangle } from "lucide-react";
import EmployeeNameLink from "@/components/employees/EmployeeNameLink";

// مؤشر عدالة التوزيع: حمل أوزان المهام لكل موظف داخل المحطة — التوزيع نفسه دليل قابل للتدقيق.
export default function DistributionFairnessPanel({ model, lang }) {
  const ar = lang === "ar";
  const { stations } = model;

  return (
    <section className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Scale className="w-4 h-4" /> {ar ? "عدالة توزيع المهام" : "Task distribution fairness"}
        </h2>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {ar
            ? "مجموع أوزان الجهد المسندة لكل موظف — فارق يتجاوز الضعف بين موظفي المحطة الواحدة يظهر كتنبيه."
            : "Total assigned effort weight per employee — a gap larger than 2× within one station raises a flag."}
        </p>
      </div>
      {stations.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{ar ? "لا توجد مهام فردية موزونة بعد." : "No weighted individual tasks yet."}</p>
      ) : (
        <div className="space-y-4">
          {stations.map((st) => (
            <div key={st.stationId} className={`rounded-lg border p-4 space-y-2.5 ${st.imbalanced ? "border-amber-300 bg-amber-50/40" : "border-border"}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm font-medium font-body">{st.name}</p>
                {st.imbalanced && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-body text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {ar ? `تفاوت في التوزيع (×${st.ratio.toFixed(1)})` : `Distribution gap (×${st.ratio.toFixed(1)})`}
                  </span>
                )}
              </div>
              {st.rows.map((r) => (
                <div key={r.empId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-body">
                    <EmployeeNameLink employeeId={r.empId} employeeName={r.name} />
                    <span className="text-muted-foreground">
                      ⚖️ {r.weightLoad} · {r.tasks} {ar ? "مهمة" : "tasks"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${Math.round((r.weightLoad / (st.maxLoad || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}