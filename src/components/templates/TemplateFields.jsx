import React from "react";

export default function TemplateFields({ fields, values, onChange, ar }) {
  return <div className="space-y-3">{fields.map((field) => {
    const props = { value: values[field.key] || "", onChange: (event) => onChange(field.key, event.target.value), placeholder: ar ? field.ar : field.en, className: "w-full rounded-md border border-input bg-card px-3 py-2 text-sm", dir: "auto" };
    return <label key={field.key} className="block space-y-1.5"><span className="text-xs font-medium">{ar ? field.ar : field.en}</span>{field.type === "textarea" ? <textarea {...props} rows={3} /> : <input {...props} type={field.type} />}</label>;
  })}</div>;
}