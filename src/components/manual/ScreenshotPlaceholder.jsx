import React from "react";
import { ImagePlus } from "lucide-react";

export default function ScreenshotPlaceholder({ screenshots = [], title }) {
  return <div className="mt-6"><h3 className="mb-3 text-sm font-bold text-foreground">لقطات الشاشة</h3>
    {screenshots.length ? <div className="grid gap-3 md:grid-cols-2">{screenshots.map((src, index) => <figure key={src} className="overflow-hidden rounded-xl border border-border bg-muted/20"><img src={src} alt={`لقطة شاشة ${title} ${index + 1}`} className="h-auto w-full object-contain" loading="eager" /><figcaption className="p-2 text-center text-xs text-muted-foreground">{title}</figcaption></figure>)}</div> : <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center"><ImagePlus className="h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">ستُضاف لقطة الشاشة هنا</p><span className="mt-1 text-xs text-muted-foreground">قريباً</span></div>}
  </div>;
}