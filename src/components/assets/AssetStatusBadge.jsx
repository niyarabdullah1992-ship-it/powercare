import React from "react";
import { assetStatusLabel } from "@/lib/assetsApi";
import { OK, WARN, BAD, NEUTRAL } from "@/lib/platformStyles";

const STYLES = {
  available: NEUTRAL,
  in_custody: OK,
  inspection: WARN,
  maintenance: WARN,
  lost: BAD,
  retired: NEUTRAL,
};

export default function AssetStatusBadge({ status, lang }) {
  return (
    <span style={STYLES[status] || NEUTRAL}>
      {assetStatusLabel(status, lang)}
    </span>
  );
}
