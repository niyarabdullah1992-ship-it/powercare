import React from "react";
import PerformanceAnalytics from "@/components/performance/PerformanceAnalytics";
import MonthlyTrends from "@/components/performance/MonthlyTrends";

// Time-based charts and stoppage issues in one place.
export default function PerformanceTrends() {
  return (
    <div className="space-y-6">
      <PerformanceAnalytics />
      <MonthlyTrends />
    </div>
  );
}