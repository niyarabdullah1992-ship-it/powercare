import React from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function AcwaDocumentToolbar({ title, subtitle, downloading, progress, total, onDownload }) {
  return <nav className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-accent/30 bg-primary px-5 py-3 text-primary-foreground shadow-lg">
    <div className="flex items-center gap-4"><Link to="/" className="flex items-center gap-1 text-xs text-primary-foreground/70 hover:text-primary-foreground"><ArrowLeft className="h-4 w-4" /> Back</Link><div><h1 className="font-heading text-lg font-semibold">{title}</h1><p className="text-[10px] text-primary-foreground/65">{subtitle}</p></div></div>
    <button onClick={onDownload} disabled={downloading} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? `PDF ${progress}/${total}` : "Download PDF • تنزيل"}</button>
  </nav>;
}