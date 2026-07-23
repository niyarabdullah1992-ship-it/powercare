import React from "react";
import HROrgStationCard from "@/components/hr/HROrgStationCard";

export default function HROrgStationRow({ stations, ar, lang }) {
  if (!stations.length) return null;
  return <><div className="mx-auto h-7 w-px bg-accent/30" /><div className="flex items-start justify-center gap-4 border-t border-accent/30 px-4">{stations.map(({ station, employees }) => <div key={station.id || station.stationId} className="relative pt-7 before:absolute before:start-1/2 before:top-0 before:h-7 before:w-px before:bg-accent/30"><HROrgStationCard station={station} employees={employees} ar={ar} lang={lang} /></div>)}</div></>;
}