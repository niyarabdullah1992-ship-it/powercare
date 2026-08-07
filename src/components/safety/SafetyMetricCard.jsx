import React from "react";
import { CircleHelp } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function SafetyMetricCard({ icon: Icon, label, value, sub, help, tone = "text-foreground", alert = false }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${alert ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
        <Popover><PopoverTrigger asChild><button type="button" aria-label={`شرح ${label}`} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><CircleHelp className="h-4 w-4" /></button></PopoverTrigger><PopoverContent align="end" className="w-80"><p className="font-heading text-sm font-semibold">{label}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{help}</p></PopoverContent></Popover>
      </div>
      <p className={`mt-3 font-heading text-2xl font-semibold leading-none ${tone}`}>{value}</p>
      <p className="mt-1.5 text-xs font-body font-medium text-foreground/80">{label}</p>
      <p className="text-[11px] font-body text-muted-foreground">{sub}</p>
    </div>
  );
}