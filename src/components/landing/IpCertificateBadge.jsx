import React from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { IP_CERTIFICATE_URL, ipCertificateTranslations } from "@/lib/ipCertificateTranslations";

export default function IpCertificateBadge({ lang }) {
  const copy = ipCertificateTranslations[lang] || ipCertificateTranslations.en;
  const details = [
    [copy.registration, "26-12-92957462"], [copy.work, "NiroVera"],
    [copy.category, copy.categoryValue], [copy.author, lang === "ar" ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"],
    [copy.date, "20/07/2026"],
  ];
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-start text-sm text-white hover:bg-white/10">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent"><ShieldCheck className="h-5 w-5" /></span>
        <span><strong className="block font-semibold">NiroVera</strong><span className="text-xs text-white/55">{copy.badge}</span></span>
      </button>
    </DialogTrigger>
    <DialogContent dir={lang === "ar" ? "rtl" : "ltr"} className="max-h-[90vh] overflow-y-auto border-landing-gold/30 bg-landing-bg sm:max-w-xl">
      <DialogHeader className="text-start"><DialogTitle className="font-heading text-2xl text-primary">{copy.title}</DialogTitle><DialogDescription>{copy.intro}</DialogDescription></DialogHeader>
      <dl className="divide-y divide-border rounded-xl border bg-card px-4">{details.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[10rem,1fr]"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="text-sm font-medium text-foreground">{value}</dd></div>)}</dl>
      <p className="text-xs leading-relaxed text-muted-foreground">{copy.note}</p>
      <a href={IP_CERTIFICATE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-landing-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-landing-gold-deep">{copy.view}<ExternalLink className="h-4 w-4" /></a>
    </DialogContent>
  </Dialog>;
}