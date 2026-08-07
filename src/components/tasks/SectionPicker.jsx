import React, { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";

export default function SectionPicker({ value, onChange, options, placeholder, ar }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const trimmed = query.trim();
  const filtered = options.filter((item) => item.toLowerCase().includes(trimmed.toLowerCase()));
  const exactMatch = options.some((item) => item.toLowerCase() === trimmed.toLowerCase());

  useEffect(() => {
    if (!open) setQuery(value || "");
  }, [value, open]);

  const choose = (section) => {
    onChange(section);
    setQuery(section);
    setOpen(false);
  };

  return (
    <div className="relative max-w-md">
      <input type="hidden" name="section" value={value} />
      <Search className="absolute start-3 top-2.5 z-10 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(event) => { setQuery(event.target.value); onChange(event.target.value); setOpen(true); }}
        placeholder={placeholder}
        className="w-full rounded-md border border-input py-2 ps-9 pe-3 text-sm font-body"
      />
      {open && (filtered.length > 0 || (trimmed && !exactMatch)) && (
        <div className="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg">
          {filtered.map((section) => (
            <button key={section} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(section)} className="block w-full rounded px-3 py-2 text-start text-sm hover:bg-muted">
              {section}
            </button>
          ))}
          {trimmed && !exactMatch && (
            <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => choose(trimmed)} className="flex w-full items-center gap-2 rounded px-3 py-2 text-start text-sm font-medium text-accent hover:bg-muted">
              <Plus className="h-4 w-4" /> {ar ? `إنشاء قسم «${trimmed}»` : `Create section “${trimmed}”`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}