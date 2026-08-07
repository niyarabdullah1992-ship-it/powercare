import React from "react";

export default function SafetyMonthPicker({ value, dailyHours = [], ltiEntries = [], lang, onChange }) {
  const ar = lang === "ar";
  const [year, month] = value.split("-");
  const currentYear = new Date().getFullYear();
  const savedYears = [...dailyHours, ...ltiEntries].map((item) => Number(String(item.date || "").slice(0, 4))).filter(Boolean);
  const years = [...new Set([...Array.from({ length: 6 }, (_, index) => currentYear - index), ...savedYears])].sort((a, b) => b - a);
  const months = Array.from({ length: 12 }, (_, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label: new Date(2024, index, 1).toLocaleDateString(ar ? "ar-SA" : "en-US", { month: "long" }),
  }));

  return (
    <div className="grid grid-cols-2 gap-2">
      <label className="text-[11px] text-muted-foreground">{ar ? "الشهر" : "Month"}<select value={month} onChange={(event) => onChange(`${year}-${event.target.value}`)} className="mt-1 w-full rounded-lg border border-input px-2 py-2 text-xs">{months.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-[11px] text-muted-foreground">{ar ? "السنة" : "Year"}<select value={year} onChange={(event) => onChange(`${event.target.value}-${month}`)} className="mt-1 w-full rounded-lg border border-input px-2 py-2 text-xs">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    </div>
  );
}