import React from "react";

// Navigation lives on the page surface, attached to the content it controls —
// never inside the identity banner. Ordered by frequency of use.
export default function PerformanceTabs({ view, setView, tabs }) {
  return (
    <div className="border-b border-border">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg text-sm font-body border transition ${
              view === tab.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.alert && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
          </button>
        ))}
      </div>
    </div>
  );
}