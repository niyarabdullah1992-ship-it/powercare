import React from "react";
import { ArrowLeft, ArrowRight, Route } from "lucide-react";

export default function MovementTracePath({ allocations = [], stationName, ar }) {
  const paths = [...new Map(allocations.filter((entry) => entry.routeStationIds?.length).map((entry) => [entry.routeStationIds.join("|"), entry])).values()];
  if (!paths.length) return null;
  const Arrow = ar ? ArrowLeft : ArrowRight;
  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground"><Route className="h-4 w-4 text-accent" />{ar ? "مسار البضاعة" : "Goods trace path"}</p>
      <div className="space-y-2">
        {paths.map((path) => <div key={path.routeStationIds.join("|")} className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-accent/10 px-2 py-1 font-mono text-accent">{String(path.traceId).slice(-8)}</span>
          {path.routeStationIds.map((stationId, index) => <React.Fragment key={`${stationId}-${index}`}><span className="rounded-lg border bg-card px-2 py-1 font-medium">{stationName(stationId)}</span>{index < path.routeStationIds.length - 1 && <Arrow className="h-3.5 w-3.5 text-muted-foreground" />}</React.Fragment>)}
          <span className="text-muted-foreground">{path.quantity} {ar ? "وحدة" : "units"}</span>
        </div>)}
      </div>
    </div>
  );
}