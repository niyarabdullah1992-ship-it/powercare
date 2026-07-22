import React, { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import TemplateFields from "@/components/templates/TemplateFields";

export default function TemplateFormDialog({ template, ar, onClose, onPrint }) {
  const [values, setValues] = useState({});
  useEffect(() => setValues({}), [template?.id]);
  if (!template) return null;
  const change = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
    <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-xl sm:max-w-xl sm:rounded-xl" onClick={(event) => event.stopPropagation()}>
      <div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="font-heading text-2xl font-semibold">{ar ? template.ar : template.en}</h2><p className="text-sm text-muted-foreground">{ar ? template.descAr : template.descEn}</p></div><button onClick={onClose} className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button></div>
      <TemplateFields fields={template.fields} values={values} onChange={change} ar={ar} />
      <button onClick={() => onPrint(template, values)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"><Printer className="h-4 w-4" />{ar ? "إنشاء المستند وطباعته / PDF" : "Create document and print / PDF"}</button>
    </div>
  </div>;
}