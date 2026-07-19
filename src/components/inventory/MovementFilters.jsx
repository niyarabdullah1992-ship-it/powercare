import React from "react";

export default function MovementFilters({ stationId, type, stations, onStation, onType, ar }) {
  return <div className="grid gap-2 sm:grid-cols-2">
    <select value={stationId} onChange={(event) => onStation(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
      <option value="">{ar ? "كل المحطات" : "All stations"}</option>
      {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
    </select>
    <select value={type} onChange={(event) => onType(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
      <option value="">{ar ? "كل أنواع الحركة" : "All movement types"}</option>
      <option value="receive">{ar ? "استلام" : "Receive"}</option><option value="issue">{ar ? "صرف" : "Issue"}</option>
      <option value="return">{ar ? "إرجاع" : "Return"}</option><option value="transfer">{ar ? "نقل" : "Transfer"}</option>
    </select>
  </div>;
}