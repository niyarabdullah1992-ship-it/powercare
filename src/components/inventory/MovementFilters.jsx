import React from "react";
import { useI18n } from "@/lib/i18n";
import MobileSelect from "@/components/mobile/MobileSelect";

export default function MovementFilters({ stationId, type, stations, onStation, onType, ar }) {
  const { t } = useI18n();
  return <div className="grid gap-2 sm:grid-cols-2">
    <MobileSelect value={stationId} onChange={onStation} searchable searchPlaceholder={ar ? "ابحث باسم المحطة أو الموقع..." : "Search station or location..."} placeholder={ar ? "كل المحطات" : "All stations"} className="w-full rounded-lg" options={[{ value: "", label: ar ? "كل المحطات" : "All stations" }, ...stations.map((station) => ({ value: station.stationId, label: station.location ? `${station.name} — ${station.location}` : station.name }))]} />
    <select value={type} onChange={(event) => onType(event.target.value)} className="rounded-lg border px-3 py-2 text-sm">
      <option value="">{ar ? "كل أنواع الحركة" : "All movement types"}</option>
      <option value="purchase">{ar ? "شراء" : "Purchase"}</option>
      <option value="transfer">{ar ? "نقل" : "Transfer"}</option>
      <option value="issue">{t("issueToWork")}</option>
    </select>
  </div>;
}