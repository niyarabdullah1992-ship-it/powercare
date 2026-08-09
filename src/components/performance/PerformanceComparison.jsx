import React, { useState } from "react";
import StationComparison from "@/components/performance/StationComparison";
import EmployeeComparisonView from "@/components/performance/EmployeeComparisonView";

// One comparison screen with a single axis switch: units or employees.
export default function PerformanceComparison({ t, ar, canCompareUnits }) {
  const [axis, setAxis] = useState(canCompareUnits ? "units" : "employees");
  const options = [
    ...(canCompareUnits ? [{ key: "units", label: ar ? "وحدات" : "Units" }] : []),
    { key: "employees", label: ar ? "موظفين" : "Employees" },
  ];

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-md border border-border bg-card p-1">
        {options.map((option) => (
          <button
            key={option.key}
            onClick={() => setAxis(option.key)}
            className={`rounded px-3 py-1.5 text-xs font-body ${axis === option.key ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {axis === "units" ? <StationComparison /> : <EmployeeComparisonView t={t} />}
    </div>
  );
}