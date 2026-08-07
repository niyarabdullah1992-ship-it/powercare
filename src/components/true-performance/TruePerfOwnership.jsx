import React, { useEffect, useState } from "react";
import { FileSignature, CalendarClock, Fingerprint } from "lucide-react";

// إقرار الملكية والأسبقية — أدلة نسبة المصنف إلى مؤلفه مع بصمة رقمية للنص.
export default function TruePerfOwnership({ ownership, fingerprintSource }) {
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    const bytes = new TextEncoder().encode(fingerprintSource);
    crypto.subtle.digest("SHA-256", bytes).then((buffer) => {
      const hex = Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
      setFingerprint(hex.toUpperCase().match(/.{1,8}/g).join(" "));
    });
  }, [fingerprintSource]);

  return (
    <div className="space-y-5">
      <p className="text-sm leading-7 text-foreground">{ownership.introAr}</p>

      <div className="space-y-3">
        {ownership.evidence.map((item, index) => (
          <div key={item.titleAr} className="flex gap-4 rounded-lg border border-border bg-card p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-semibold text-landing-gold-light">{index + 1}</span>
            <div>
              <p className="font-heading text-base font-semibold text-primary">{item.titleAr}</p>
              <p className="mt-1 text-[12px] leading-6 text-muted-foreground">{item.textAr}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-accent/40 bg-secondary/50 p-5">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4 text-accent" strokeWidth={1.6} />
          <p className="font-heading text-base font-semibold text-primary">{ownership.fingerprintTitleAr}</p>
        </div>
        <p className="mt-1.5 text-[12px] leading-6 text-muted-foreground">{ownership.fingerprintNoteAr}</p>
        <p dir="ltr" className="mt-3 break-all rounded border border-border bg-background p-3 font-mono text-[11px] leading-5 text-primary">
          {fingerprint || "…"}
        </p>
      </div>

      <div className="rounded-lg border border-accent/40 bg-primary p-6 text-primary-foreground">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-landing-gold-light" strokeWidth={1.6} />
          <h3 className="font-heading text-xl font-semibold">{ownership.declarationTitleAr}</h3>
        </div>
        <p className="mt-3 text-[13px] leading-7 text-primary-foreground/85">{ownership.declarationAr}</p>
        <div className="mt-6 grid grid-cols-2 gap-6 text-[12px]">
          <div>
            <p className="text-primary-foreground/60">اسم المؤلف</p>
            <p className="mt-1 font-semibold">{ownership.authorAr}</p>
            <div className="mt-6 h-px bg-primary-foreground/30" />
            <p className="mt-1 text-primary-foreground/60">التوقيع</p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-primary-foreground/60"><CalendarClock className="h-3.5 w-3.5" strokeWidth={1.6} /> تاريخ الإقرار</p>
            <p className="mt-1 font-semibold">{ownership.dateAr}</p>
            <div className="mt-6 h-px bg-primary-foreground/30" />
            <p className="mt-1 text-primary-foreground/60">ختم / شاهد</p>
          </div>
        </div>
      </div>
    </div>
  );
}