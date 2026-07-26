import React from "react";
import { FileText, Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PowerCareUploadZone({
  onClick,
  disabled,
  loading,
  title,
  description,
  formats,
  compact = false,
  className,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-accent/35 bg-secondary/25 p-6 text-center text-foreground hover:border-accent hover:bg-accent/5 disabled:opacity-60",
        compact ? "min-h-[120px]" : "min-h-[460px]",
        className
      )}
    >
      <span className={cn("flex items-center justify-center rounded-full bg-primary text-primary-foreground", compact ? "mb-3 h-12 w-12" : "mb-4 h-16 w-16")}>
        {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
      </span>
      <span className="text-sm font-bold sm:text-base">{title}</span>
      {description && <span className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">{description}</span>}
      {formats && <span className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"><FileText className="h-4 w-4" />{formats}</span>}
    </button>
  );
}