import React from "react";
import MobileSelect from "@/components/mobile/MobileSelect";
import { INVENTORY_REPORT_THEMES } from "@/lib/inventoryReportThemes";

export default function InventoryReportThemeSelect({ value, onChange, ar }) {
  const options = INVENTORY_REPORT_THEMES.map((theme) => ({
    value: theme.value,
    label: ar ? theme.labelAr : theme.labelEn,
  }));

  return (
    <MobileSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={ar ? "نموذج PDF" : "PDF template"}
      className="min-w-40"
    />
  );
}