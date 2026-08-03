import React from "react";
import { Check, X } from "lucide-react";

function Mark({ value, positive }) {
  const Icon = positive ? Check : X;
  return <span className={`flex items-center justify-center gap-1 text-[9px] font-semibold ${positive ? "text-accent" : "text-muted-foreground"}`}><Icon className="h-3 w-3" />{value}</span>;
}

export default function AcwaComparisonVisual({ data }) {
  return <div className="h-full overflow-hidden">
    <div className="grid grid-cols-[1.4fr_1fr_1fr] bg-secondary px-3 py-2 text-center text-[9px] font-bold"><span className="text-left">Capability · القدرة</span><span>NiroVera</span><span>{data.traditionalLabel || "Traditional"}</span></div>
    {data.rows.map((row, index) => <div key={index} className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-t border-border px-3 py-2.5">
      <div><p className="font-body text-[10px] font-semibold">{row.feature}</p><p dir="rtl" className="text-left text-[8px] text-muted-foreground">{row.featureAr}</p></div>
      <Mark value={row.powercare} positive />
      <Mark value={row.traditional} positive={false} />
    </div>)}
  </div>;
}