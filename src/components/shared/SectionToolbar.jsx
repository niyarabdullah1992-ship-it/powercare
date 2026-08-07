import React from "react";

// شريط أدوات موحّد لكل الأقسام: تبويبات على جهة، وأزرار تقرير/تصدير على الجهة الأخرى.
const pill = (active) =>
  `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${
    active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"
  }`;

export default function SectionToolbar({ tabs = [], activeTab, onTabChange, actions = [] }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => (
          <button key={tab.key} type="button" onClick={() => onTabChange(tab.key)} className={pill(activeTab === tab.key)}>
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />} {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {actions.map((action) => (
          <button key={action.key} type="button" onClick={action.onClick} className={pill(action.active)}>
            {action.icon && <action.icon className="w-3.5 h-3.5" />} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}