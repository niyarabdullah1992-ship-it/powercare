import React from "react";
import ErpKpiStrip from "@/components/erp/ErpKpiStrip";

/**
 * ERP section frame — KPIs then the page body.
 */
export default function ErpSectionFrame({ stats, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {stats?.length ? <ErpKpiStrip stats={stats} /> : null}
      {children}
    </div>
  );
}
