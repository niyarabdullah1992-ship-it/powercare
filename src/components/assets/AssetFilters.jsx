import React from "react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { ASSET_STATUSES, assetStatusLabel } from "@/lib/assetsApi";

export default function AssetFilters({ lang, stations, categories, filters, setFilters }) {
  const set = (key) => (value) => setFilters({ ...filters, [key]: value });
  const all = lang === "ar" ? "الكل" : "All";

  return (
    <div className="flex flex-wrap gap-2">
      <MobileSelect
        value={filters.category} onChange={set("category")} placeholder={lang === "ar" ? "الفئة" : "Category"}
        className="min-w-[150px]"
        options={[{ value: "all", label: all }, ...categories.map((c) => ({ value: c, label: c }))]}
      />
      <MobileSelect
        value={filters.stationId} onChange={set("stationId")} searchable placeholder={lang === "ar" ? "الوحدة" : "Unit"}
        className="min-w-[170px]"
        options={[{ value: "all", label: all }, ...stations.map((s) => ({ value: s.id, label: s.name }))]}
      />
      <MobileSelect
        value={filters.status} onChange={set("status")} placeholder={lang === "ar" ? "الحالة" : "Status"}
        className="min-w-[150px]"
        options={[{ value: "all", label: all }, ...ASSET_STATUSES.map((s) => ({ value: s, label: assetStatusLabel(s, lang) }))]}
      />
    </div>
  );
}