import React, { useLayoutEffect, useRef, useState } from "react";

// Underline tabs with a sliding accent indicator. Order and isManager grouping are
// unchanged — only the resting look moved from pills to a bottom rule.
export default function PerformanceTabs({ view, setView, isManager, t, lang, supervisionAlert }) {
  const containerRef = useRef(null);
  const buttonRefs = useRef({});
  const [indicator, setIndicator] = useState({ x: 0, width: 0 });

  const sharedTabs = [
    { key: "employeeComparison", label: t("employeeComparison") },
    { key: "achievements", label: t("achievementsBoard") },
  ];
  const firstManagerTabs = [
    { key: "station", label: t("stationRanking") },
    { key: "comparison", label: t("stationComparison") },
    { key: "individualReport", label: t("individualReport") },
  ];
  const lastManagerTabs = [
    { key: "analytics", label: lang === "ar" ? "تحليلات المهام" : "Task analytics" },
    { key: "trends", label: lang === "ar" ? "الاتجاهات الشهرية" : "Monthly trends" },
    { key: "supervision", label: lang === "ar" ? "الإشراف والعدالة" : "Supervision & fairness", alert: supervisionAlert },
  ];

  useLayoutEffect(() => {
    const measure = () => {
      const container = containerRef.current;
      const active = buttonRefs.current[view];
      if (!container || !active) return setIndicator({ x: 0, width: 0 });
      const c = container.getBoundingClientRect();
      const b = active.getBoundingClientRect();
      // Measured against the container, so RTL and horizontal scroll both hold.
      setIndicator({ x: b.left - c.left + container.scrollLeft, width: b.width });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [view, isManager, lang]);

  const tabButton = (tab) => (
    <button
      key={tab.key}
      ref={(el) => { buttonRefs.current[tab.key] = el; }}
      onClick={() => setView(tab.key)}
      className={`relative px-4 min-h-[44px] text-sm font-body inline-flex items-center gap-1.5 ${
        view === tab.key ? "text-white font-medium" : "text-white/65 hover:text-white/90"
      }`}
    >
      {tab.label}
      {tab.alert && <span className="w-1.5 h-1.5 rounded-full bg-destructive" aria-hidden="true" />}
    </button>
  );

  return (
    <div ref={containerRef} className="performance-hub-tabs relative flex items-center">
      {isManager && firstManagerTabs.map(tabButton)}
      {sharedTabs.map(tabButton)}
      {isManager && <span className="w-px h-4 bg-white/15 self-center mx-1" aria-hidden="true" />}
      {isManager && lastManagerTabs.map(tabButton)}
      <span
        className="perf-tab-indicator absolute bottom-0 left-0 h-[2px]"
        aria-hidden="true"
        style={{
          background: "hsl(var(--accent))",
          width: `${indicator.width}px`,
          transform: `translateX(${indicator.x}px)`,
        }}
      />
    </div>
  );
}