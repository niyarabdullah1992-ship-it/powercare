import React from "react";
import { Link } from "react-router-dom";

export default function EmployeeNameLink({ employeeId, employeeName, className = "", ...props }) {
  if (!employeeId) return <span className={className}>{employeeName || "—"}</span>;

  return (
    <Link
      to={`/app/employees/${encodeURIComponent(employeeId)}`}
      className={`underline decoration-accent/30 underline-offset-2 hover:text-accent hover:decoration-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm ${className}`}
      {...props}
    >
      {employeeName || "—"}
    </Link>
  );
}