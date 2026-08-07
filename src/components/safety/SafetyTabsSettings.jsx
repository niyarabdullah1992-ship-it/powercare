import React from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export default function SafetyTabsSettings({ tabs, disabledTabs, ar, onChange }) {
  const toggle = (key, enabled) => {
    if (key === "overview") return;
    onChange(enabled ? disabledTabs.filter((item) => item !== key) : [...disabledTabs, key]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={ar ? "تخصيص تبويبات السلامة" : "Customize safety tabs"}>
          <Settings2 className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-3 p-3" dir={ar ? "rtl" : "ltr"}>
        <div>
          <p className="text-sm font-semibold">{ar ? "تخصيص التبويبات" : "Customize tabs"}</p>
          <p className="text-[11px] text-muted-foreground">{ar ? "اختر ما ينطبق على هذه المحطة." : "Choose what applies to this station."}</p>
        </div>
        <div className="space-y-1">
          {tabs.map(([key, Icon, label]) => {
            const enabled = key === "overview" || !disabledTabs.includes(key);
            return (
              <label key={key} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/60">
                <span className={`flex items-center gap-2 text-xs ${enabled ? "" : "text-muted-foreground line-through"}`}><Icon className="h-3.5 w-3.5" />{label}</span>
                <Switch checked={enabled} disabled={key === "overview"} onCheckedChange={(checked) => toggle(key, checked)} aria-label={label} />
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}