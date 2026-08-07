import React from "react";
import { AlertTriangle } from "lucide-react";
import HROrgStationRow from "@/components/hr/HROrgStationRow";

export default function HROrgUnassignedBranch({ stations, ar, lang }) {
  return <section className="relative flex min-w-[280px] flex-col items-center pt-8 before:absolute before:start-1/2 before:top-0 before:h-8 before:w-px before:bg-accent/30">
    <div className="w-52 rounded-lg border border-dashed border-accent/50 bg-accent/5 p-3 text-center"><AlertTriangle className="mx-auto h-4 w-4 text-accent" /><p className="mt-1 text-xs font-semibold">{ar ? "محطات غير مُعيّنة" : "Unassigned stations"}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{ar ? "لا يوجد مسؤول HR مرتبط" : "No HR supervisor assigned"}</p></div>
    <HROrgStationRow stations={stations} ar={ar} lang={lang} />
  </section>;
}