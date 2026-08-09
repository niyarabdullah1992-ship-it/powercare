import React from "react";
import { assetStatusLabel } from "@/lib/assetsApi";

const STYLES = {
  available: "border-border bg-muted text-foreground",
  in_custody: "border-emerald-300 bg-emerald-50 text-emerald-800",
  inspection: "border-amber-300 bg-amber-50 text-amber-800",
  maintenance: "border-amber-300 bg-amber-50 text-amber-800",
  lost: "border-red-300 bg-red-50 text-red-700",
  retired: "border-border bg-muted text-muted-foreground",
};

export default function AssetStatusBadge({ status, lang }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-body ${STYLES[status] || STYLES.available}`}>
      {assetStatusLabel(status, lang)}
    </span>
  );
}