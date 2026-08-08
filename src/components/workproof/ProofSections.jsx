import React from "react";
import { Paperclip } from "lucide-react";
import { Image } from "@/components/ui/image";

export function SectionLabel({ icon: Icon, children }) {
  return (
    <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-text">
      {Icon && <Icon className="h-3 w-3" />}{children}
    </p>
  );
}

export function PhotoRow({ label, urls }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <SectionLabel>{label}</SectionLabel>
      {urls?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {urls.map((url) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="group relative">
              <Image src={url} alt={label} className="h-16 w-16 rounded-md border border-border shadow-sm transition group-hover:border-accent" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground font-body">—</p>
      )}
    </div>
  );
}

export function FileRow({ label, files }) {
  if (!files?.length) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <SectionLabel icon={Paperclip}>{label}</SectionLabel>
      <ul className="space-y-1">
        {files.map((file) => (
          <li key={file.url}>
            <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1.5 truncate text-xs font-body text-accent-text hover:underline">
              <Paperclip className="h-3 w-3 shrink-0" /><span className="truncate">{file.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DetailList({ icon, label, items }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <SectionLabel icon={icon}>{label}</SectionLabel>
      <ul className="space-y-1 text-xs font-body">
        {items.map((text, index) => (
          <li key={index} className="flex gap-2 text-foreground/80">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
            <span className="min-w-0">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}