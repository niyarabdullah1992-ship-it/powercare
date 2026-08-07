import React from "react";
import { CheckCircle2, Clock3, FilePlus2, MapPin, XCircle } from "lucide-react";

const icons = { created: FilePlus2, signed: CheckCircle2, rejected: XCircle };

export default function SigningAuditTrail({ events = [], ar }) {
  if (!events.length) return null;
  return <details className="group rounded-xl border border-accent/15 bg-landing-bg/40 p-4">
    <summary className="cursor-pointer list-none text-xs font-bold text-foreground marker:hidden">{ar ? "سجل التدقيق الكامل" : "Full audit trail"}</summary>
    <div className="mt-4 space-y-4 border-s-2 border-accent/20 ps-4">
      {events.map((event, index) => { const Icon = icons[event.type] || Clock3; return <div key={`${event.at}-${index}`} className="text-xs">
        <p className="flex items-center gap-2 font-medium"><Icon className="h-3.5 w-3.5 text-accent" />{event.actorName || "NiroVera"} · {event.type}</p>
        <p className="mt-1 text-muted-foreground">{new Date(event.at).toLocaleString(ar ? "ar-SA" : "en-GB")}</p>
        {event.location?.lat != null && <p className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="h-3 w-3" />{event.location.lat.toFixed(5)}, {event.location.lng.toFixed(5)} ±{Math.round(event.location.accuracy || 0)}m</p>}
        {event.documentHash && <p dir="ltr" className="mt-1 truncate font-mono text-[9px] text-muted-foreground">SHA-256 {event.documentHash}</p>}
      </div>; })}
    </div>
  </details>;
}