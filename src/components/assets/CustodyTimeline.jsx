import React from "react";
import { ArrowLeftRight } from "lucide-react";
import { formatDateTime } from "@/lib/dateFormat";
import { Image } from "@/components/ui/image";

export default function CustodyTimeline({ records, lang }) {
  if (!records.length) return <p className="text-sm font-body text-muted-foreground">{lang === "ar" ? "لا يوجد سجل عهدة." : "No custody records."}</p>;

  return (
    <div className="space-y-3">
      {records.map((r) => (
        <div key={r.id} className="rounded-[10px] border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-body flex items-center gap-1.5">
              <ArrowLeftRight className="w-4 h-4 text-accent" />
              {r.fromName || "—"} → <span className="font-medium">{r.toName}</span>
            </p>
            <span className="text-xs font-display tabular-nums text-muted-foreground">{formatDateTime(r.handedAt, lang)}</span>
          </div>
          {r.condition && <p className="text-xs font-body text-muted-foreground mt-1">{r.condition}</p>}
          <div className="mt-2 flex flex-wrap gap-3">
            {[r.fromSignatureUrl, r.toSignatureUrl].filter(Boolean).map((url, i) => (
              <Image key={i} src={url} alt="signature" fittingType="fit" className="h-10 w-24 rounded border border-border bg-card" />
            ))}
            {(r.imageUrls || []).map((url) => (
              <Image key={url} src={url} alt="asset" className="h-10 w-10 rounded border border-border" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}