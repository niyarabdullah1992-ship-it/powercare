import React, { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

// Searchable single-select station picker — replaces long <select>/pill lists with
// a compact, filterable combobox. `options` is [{ value, label }], value can be "" for none.
export default function StationCombobox({ options, value, onChange, placeholder, t, className }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-body text-sm font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {selected ? selected.label : (placeholder || t?.("selectStation") || "Select station")}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={t?.("search") || "Search..."} />
          <CommandList>
            <CommandEmpty>{t?.("noResults") || "No results"}</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value || "none"}
                  value={o.label}
                  onSelect={() => { onChange(o.value); setOpen(false); }}
                >
                  <Check className={cn("me-2 h-4 w-4", value === o.value ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}