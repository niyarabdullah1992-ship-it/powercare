import React from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PowerCareUploadZone({
  onClick,
  disabled,
  loading,
  title,
  description,
  formats,
  compact = false,
  label,
  className,
}) {
  const isArabic = /[\u0600-\u06FF]/.test(`${title || ""} ${description || ""}`);
  const uploadLabel = label || (isArabic ? "رفع ملف" : "Upload file");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={uploadLabel}
      className={cn(
        "flex !min-h-[72px] w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-accent/35 bg-secondary/25 px-6 py-4 text-foreground hover:border-accent hover:bg-accent/5 disabled:opacity-60",
        className
      )}
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : <Upload className="h-5 w-5 text-accent" />}
      <span className="text-sm font-bold sm:text-base">{uploadLabel}</span>
    </button>
  );
}