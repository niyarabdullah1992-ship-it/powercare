import React from "react";
import { AlertTriangle } from "lucide-react";

export default function BudgetAlert({ purchases, threshold, ar }) {
  const now = new Date();
  const total = purchases.filter((entry) => { const date = new Date(entry.purchaseDate || entry.created_date); return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); }).reduce((sum, entry) => sum + Number(entry.totalCost || 0), 0);
  if (total < threshold * 0.8) return null;
  const exceeded = total >= threshold;
  return <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${exceeded ? "border-red-300 bg-red-50 text-red-800" : "border-amber-300 bg-amber-50 text-amber-800"}`}>
    <AlertTriangle className="h-5 w-5 shrink-0" />
    <p className="text-sm font-medium">{exceeded ? (ar ? "تم تجاوز حد ميزانية المشتريات الشهرية" : "Monthly purchase budget threshold exceeded") : (ar ? "اقتربت مشتريات الشهر من حد الميزانية" : "Monthly purchases are nearing the budget threshold")} — {total.toLocaleString()} / {threshold.toLocaleString()} SAR</p>
  </div>;
}