import React from "react";
import { Cloud, Copy, ExternalLink, Smartphone } from "lucide-react";

export default function CameraProviderGuide({ provider, ar }) {
  if (!provider) return null;
  const steps = ar ? provider.stepsAr : provider.stepsEn;
  return <section className="rounded-lg border border-accent/30 bg-accent/5 p-4">
    <div className="flex items-start gap-3"><span className="rounded-full bg-accent/15 p-2 text-accent"><Smartphone className="h-5 w-5" /></span><div><h3 className="font-semibold">{ar ? `ربط ${provider.name} بدون خبرة تقنية` : `Connect ${provider.name} without technical setup`}</h3><p className="mt-1 text-xs text-muted-foreground">{ar ? provider.hintAr : provider.hintEn}</p></div></div>
    <ol className="mt-4 grid gap-2 sm:grid-cols-2">{steps.map((step, index) => <li key={step} className="flex gap-2 rounded-md border border-border bg-card p-3 text-xs leading-5"><span className="font-bold text-accent">{index + 1}</span><span>{step}</span></li>)}</ol>
    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><Cloud className="h-4 w-4 text-accent" /><span>{ar ? "☁️ انسخ رابط المشاهدة السحابي، وليس عنوان IP المحلي." : "☁️ Copy the cloud viewing link, not the local IP address."}</span></div>
    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Copy className="h-4 w-4 text-accent" /><span>{ar ? "🔗 الصق الرابط في الحقل أدناه ثم اختبر الاتصال." : "🔗 Paste the link below, then test the connection."}</span><ExternalLink className="h-3.5 w-3.5" /></div>
  </section>;
}