import React from "react";
import { useI18n } from "@/lib/i18n";
import { HR_PERMISSIONS, hrPermLabel, hrPermDescription } from "@/lib/hrPermissions";

// Reusable checklist so any HR level (manager or assistant) can be granted any
// combination of permissions — nothing about a level's rights is fixed anymore.
export default function HRPermissionsChecklist({ value, onChange }) {
  const { lang } = useI18n();
  const toggle = (key) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {HR_PERMISSIONS.map((key) => (
        <label key={key} className="flex items-start gap-2 text-xs font-body p-1.5 rounded-md hover:bg-muted cursor-pointer">
          <input type="checkbox" className="mt-0.5" checked={value.includes(key)} onChange={() => toggle(key)} />
          <span>
            <span className="block">{hrPermLabel(key, lang)}</span>
            <span className="block text-[10px] text-muted-foreground">{hrPermDescription(key, lang)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}