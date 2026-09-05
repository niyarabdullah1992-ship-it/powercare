import React from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { BORDER, MUTED, NAVY, SURFACE, CARD } from "@/lib/platformStyles";

export default function SafetyTabsSettings({ tabs, disabledTabs, ar, onChange }) {
  const toggle = (key, enabled) => {
    if (key === "overview") return;
    onChange(enabled ? disabledTabs.filter((item) => item !== key) : [...disabledTabs, key]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          style={{
            display: "flex",
            width: "32px",
            height: "32px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "999px",
            border: `1px solid ${BORDER}`,
            background: CARD,
            color: MUTED,
            cursor: "pointer",
          }}
          aria-label={ar ? "تخصيص تبويبات السلامة" : "Customize safety tabs"}
        >
          <Settings2 style={{ width: 14, height: 14 }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-3" dir={ar ? "rtl" : "ltr"}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "تخصيص التبويبات" : "Customize tabs"}</p>
          <p style={{ margin: "4px 0 0", fontSize: "11px", color: MUTED }}>
            {ar ? "اختر ما ينطبق على هذا الفرع." : "Choose what applies to this station."}
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {tabs.map(([key, Icon, label]) => {
            const enabled = key === "overview" || !disabledTabs.includes(key);
            return (
              <label
                key={key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  borderRadius: "10px",
                  padding: "8px",
                  background: enabled ? "transparent" : SURFACE,
                }}
              >
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: enabled ? NAVY : MUTED,
                  textDecoration: enabled ? "none" : "line-through",
                }}
                >
                  <Icon style={{ width: 14, height: 14 }} />{label}
                </span>
                <Switch checked={enabled} disabled={key === "overview"} onCheckedChange={(checked) => toggle(key, checked)} aria-label={label} />
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
