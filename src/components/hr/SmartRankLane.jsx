import React from "react";
import SmartPositionCard from "@/components/hr/SmartPositionCard";
import { rankLabel } from "@/lib/smartPositions";

export default function SmartRankLane({ rank, items, ar, onEdit }) {
  if (!items.length) return null;
  return <div><div className="mx-auto h-7 w-px bg-accent/40" /><p className="mb-2 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{rankLabel(rank, ar)}</p><div className="relative flex flex-wrap justify-center gap-4 border-t border-accent/30 pt-5">{items.map(({ position, employee }) => <SmartPositionCard key={position.employeeId} position={position} employee={employee} ar={ar} onClick={() => onEdit(position)} />)}</div></div>;
}