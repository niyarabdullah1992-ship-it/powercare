import React from "react";

// Standard table header row used across every report table, so column
// headers look identical everywhere (Reports, Station Comparison, Employee Report).
export default function ReportTableHead({ columns }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider">
        {columns.map((label, i) => (
          <th key={i} className="py-2 px-2 text-start">{label}</th>
        ))}
      </tr>
    </thead>
  );
}