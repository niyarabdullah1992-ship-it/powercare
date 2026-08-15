import React from "react";

/** Nested attendance rail — same chrome as `.nv-tabrail`, not a second tab system. */
export default function AttHubTabRail({ tabs, active, onChange, dir }) {
  return (
    <div dir={dir} className="nv-tabrail" role="tablist">
      {tabs.map((tb) => {
        const on = active === tb.key;
        return (
          <button
            key={tb.key}
            type="button"
            role="tab"
            onClick={() => onChange(tb.key)}
            aria-selected={on}
            aria-current={on ? "true" : undefined}
            data-active={on ? "true" : undefined}
          >
            {tb.label}
          </button>
        );
      })}
    </div>
  );
}
