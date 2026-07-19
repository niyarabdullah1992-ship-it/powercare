import React from "react";
import { useI18n } from "@/lib/i18n";

export default function MovementFilters({ stationId, type, stations, onStation, onType, ar }) {
  const { t } = useI18n();
  return <div className="grid gap-2 sm:grid-cols-2">
    <select value={stationId} onChange={(event) => onStation(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
      <option value="">{ar ? "كل المحطات" : "All stations"}</option>
      {stations.map((station) => <option key={station.stationId} value={station.stationId}>{station.name}</option>)}
    </select>
    <select value={type} onChange={(event) => onType(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
      <option value="">{ar ? "كل أنواع الحركة" : "All movement types"}</option>
      <option value="purchase">{ar ? "شراء" : "Purchase"}</option>
      <option value="transfer">{ar ? "نقل" : "Transfer"}</option>
      <option value="issue">{t("issueToWork")}</option>
    </select>
  </div>;
}