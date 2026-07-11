import React from "react";

// Standard card container used across every report/comparison view (Reports,
// Daily Report, Station Comparison, Employee Report) so all sections share the
// same padding, radius, border and shadow — no more ad-hoc spacing per page.
export default function ReportCard({ title, icon: Icon, children, className = "" }) {
  return (
    <div className={`p-4 rounded-xl border border-border bg-card shadow-sm ${className}`}>
      {title && (
        <h3 className="font-heading text-base font-semibold mb-4 flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />} {title}
        </h3>
      )}
      {children}
    </div>
  );
}