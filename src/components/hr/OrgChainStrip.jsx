import React from "react";
import { ORG_CHAIN } from "@/lib/orgChain";
import { ORG_GREEN } from "@/lib/orgWorkspaceStyles";

/** Health signals only — tab counts live on the step bar; guidance is the next action. */
export default function OrgChainStrip({ ar, onTool, health, next }) {
  const nextLabel = ar ? (next?.ar || "") : (next?.en || "");
  const nextStep = ORG_CHAIN.find((step) => step.value === next?.tab);
  const jump = Boolean(next?.tab);
  const chainComplete = next?.tone === "green";

  const metrics = [
    {
      id: "vacant",
      tab: "branches",
      value: health?.vacant || 0,
      label: ar ? "بلا مدير" : "Vacant",
      warn: (health?.vacant || 0) > 0,
    },
    {
      id: "acting",
      tab: "branches",
      value: health?.acting || 0,
      label: ar ? "وكالة" : "Acting",
      warn: false,
      hide: !(health?.acting),
    },
    {
      id: "pub",
      tab: "branches",
      value: health?.unpublished ? "—" : "✓",
      label: health?.unpublished ? (ar ? "مسودة" : "Draft") : (ar ? "منشور" : "Live"),
      warn: health?.unpublished,
    },
  ].filter((row) => !row.hide);

  return (
    <div className="nv-org-chain">
      <div className="nv-org-chain__row">
        <div className="nv-org-chain__metrics" role="group" aria-label={ar ? "حالة الهيكل" : "Structure health"}>
          {metrics.map((metric) => (
            <button
              key={metric.id}
              type="button"
              className={`nv-org-metric${metric.warn ? " nv-org-metric--warn" : ""}`}
              onClick={() => onTool?.(metric.tab)}
            >
              <span className="nv-org-metric__value">{metric.value}</span>
              <span className="nv-org-metric__label">{metric.label}</span>
            </button>
          ))}
        </div>
        {chainComplete ? (
          <span className="nv-org-chain__ready" style={{ color: ORG_GREEN }}>
            {ar ? "مكتمل" : "Complete"}
          </span>
        ) : jump ? (
          <button type="button" className="nv-org-chain__next" onClick={() => onTool?.(next.tab)}>
            {ar ? `متابعة · ${nextStep?.ar || ""}` : `Continue · ${nextStep?.en || ""}`}
          </button>
        ) : null}
      </div>
      {!chainComplete && nextLabel ? (
        <p className="nv-org-chain__copy">{nextLabel}</p>
      ) : null}
    </div>
  );
}
