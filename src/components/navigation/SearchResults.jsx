import React from "react";

export default function SearchResults({ results, onSelect, lang }) {
  if (!results.length) return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{lang === "ar" ? "لا توجد نتائج مطابقة" : "No matching results"}</p>;
  return (
    <div className="max-h-[55vh] overflow-y-auto p-2">
      {results.map((result) => <button key={`${result.type}-${result.id}`} onClick={() => onSelect(result)} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-start hover:bg-muted">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><result.icon className="h-4 w-4" /></span>
        <span className="min-w-0"><span className="block truncate text-sm font-medium">{result.label}</span><span className="block text-xs text-muted-foreground">{result.subtitle}</span></span>
      </button>)}
    </div>
  );
}