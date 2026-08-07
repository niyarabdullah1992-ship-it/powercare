import React from "react";
import { WandSparkles } from "lucide-react";

export default function HierarchyTemplates({ onApply, lang }) {
  const ar = lang === "ar";
  const templates = ar ? [
    ["station", "مدير الموارد البشرية بالمحطة", "مساعد الموارد البشرية بالمحطة", "قالب محطة"],
    ["cluster", "مدير الموارد البشرية للمجموعة", "مساعد موارد بشرية للمجموعة", "قالب مجموعة"],
    ["company", "مدير الموارد البشرية", "منسق الموارد البشرية", "قالب الشركة"],
  ] : [
    ["station", "Station HR Manager", "Station HR Assistant", "Station template"],
    ["cluster", "Cluster HR Manager", "Cluster HR Assistant", "Cluster template"],
    ["company", "HR Director", "HR Coordinator", "Company template"],
  ];
  return <div className="flex flex-wrap items-center gap-2"><span className="flex items-center gap-1.5 text-xs font-semibold"><WandSparkles className="h-4 w-4 text-accent" />{ar ? "قوالب ذكية" : "Smart templates"}</span>{templates.map(([scope, manager, assistant, label]) => <button key={scope} onClick={() => onApply(scope, manager, assistant)} className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-accent hover:bg-accent/5">{label}</button>)}</div>;
}