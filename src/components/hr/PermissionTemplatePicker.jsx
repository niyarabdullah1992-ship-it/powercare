import React from "react";
import { BookmarkPlus, LayoutTemplate } from "lucide-react";
import { INHERIT_TEMPLATE_ID, companyTemplates, saveCompanyTemplate, templateLabel } from "@/lib/permissionTemplates";

// One click fills the whole permission grid. The template is a starting point —
// editing any row afterwards simply marks the node as customized.
export default function PermissionTemplatePicker({ data, companyId, value, onSelect, hasParent, permissions, customized, ar }) {
  const templates = companyTemplates(data);
  const chip = (active) => `rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${active ? "border-accent bg-accent text-accent-foreground" : "border-border bg-muted/40 hover:border-accent/60"}`;
  const saveAsNew = () => {
    const name = window.prompt(ar ? "اسم القالب الجديد" : "New template name");
    if (name?.trim()) saveCompanyTemplate(companyId, name.trim(), permissions);
  };
  return (
    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-accent"><LayoutTemplate className="h-3.5 w-3.5" />{ar ? "القالب — يملأ الجدول أدناه ثم يمكنك تعديل أي صف" : "Template — fills the grid below, every row stays editable"}</p>
        {customized && <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">{ar ? "معدَّل عن القالب" : "Customized"}</span>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {hasParent && <button type="button" onClick={() => onSelect(INHERIT_TEMPLATE_ID)} className={chip(value === INHERIT_TEMPLATE_ID)}>{ar ? "مثل العقدة الأعلى" : "Like parent node"}</button>}
        {templates.map((template) => (
          <button key={template.id} type="button" onClick={() => onSelect(template.id)} className={chip(value === template.id)}>{templateLabel(template, ar)}</button>
        ))}
        <button type="button" onClick={saveAsNew} className="flex items-center gap-1 rounded-full border border-dashed border-accent/50 px-3 py-1.5 text-[11px] font-semibold text-accent">
          <BookmarkPlus className="h-3.5 w-3.5" />{ar ? "حفظ القالب باسم جديد" : "Save as new template"}
        </button>
      </div>
    </div>
  );
}