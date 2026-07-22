import React, { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { DOCUMENT_TEMPLATES, templateDocument } from "@/lib/documentTemplates";
import { printDocument } from "@/lib/printDocument";
import TemplatesHeader from "@/components/templates/TemplatesHeader";
import TemplateCard from "@/components/templates/TemplateCard";
import TemplateFormDialog from "@/components/templates/TemplateFormDialog";

export default function Templates() {
  const { lang } = useI18n();
  const { company, currentUser } = useAuth();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const ar = lang === "ar";
  const templates = useMemo(() => DOCUMENT_TEMPLATES.filter((item) => (category === "all" || item.category === category) && `${item.ar} ${item.en}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const print = (template, values) => printDocument({ ...templateDocument(template, values, ar), dir: ar ? "rtl" : "ltr", companyName: company?.name || "PowerCare", authorName: currentUser?.name || "" });
  return <div className="space-y-6"><TemplatesHeader ar={ar} /><div className="flex flex-col gap-3 sm:flex-row"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={ar ? "ابحث عن قالب..." : "Search templates..."} className="flex-1 rounded-md border border-input bg-card px-4 py-2.5 text-sm" />
    <div className="flex gap-2">{[["all",ar?"الكل":"All"],["hr",ar?"الموارد البشرية":"HR"],["company",ar?"إدارة الشركات":"Company"]].map(([key,label]) => <button key={key} onClick={() => setCategory(key)} className={`rounded-full px-4 py-2 text-sm ${category === key ? "bg-primary text-primary-foreground" : "border border-border bg-card"}`}>{label}</button>)}</div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{templates.map((template) => <TemplateCard key={template.id} template={template} ar={ar} onUse={setSelected} />)}</div>
    <TemplateFormDialog template={selected} ar={ar} onClose={() => setSelected(null)} onPrint={print} /></div>;
}