import React from "react";
import { Download, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function ComparisonToolbar({ downloading, progress, total, onDownload }) {
  return <div dir="rtl" className="sticky top-0 z-40 flex items-center justify-between border-b border-accent/30 bg-primary px-5 py-3 text-primary-foreground shadow-lg">
    <div><h1 className="font-heading text-xl font-semibold">مقارنة NiroVera وSAP</h1><p className="text-xs text-primary-foreground/65">{total} صفحات • مقارنة واقعية ومتوازنة</p></div>
    <div className="flex items-center gap-2"><Link to="/powercare-profile" className="rounded-md border border-primary-foreground/20 px-3 py-2 text-xs">الملف التعريفي</Link><button onClick={onDownload} disabled={downloading} className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60">{downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{downloading ? `PDF ${progress}/${total}` : "تنزيل PDF"}</button></div>
  </div>;
}