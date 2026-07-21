import React from "react";
import { Download, Loader2, ShieldCheck } from "lucide-react";

export default function ManualHeader({ meta, labels, languages, activeLang, onLanguage, onDownload, exporting }) {
  return (
    <header className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-elevated md:p-10 print:rounded-none">
      <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold tracking-widest text-landing-gold-light"><ShieldCheck className="h-4 w-4" /> POWERCARE USER MANUAL</div>
          <h1 className="font-heading text-3xl font-semibold md:text-5xl">{meta.title}</h1>
          <p className="mt-3 text-sm leading-7 text-primary-foreground/70">{meta.subtitle}</p>
          <p className="mt-4 rounded-xl border border-primary-foreground/15 bg-primary-foreground/5 p-3 text-xs leading-6">{meta.notice}</p>
        </div>
        <div className="no-print flex flex-col gap-3 sm:flex-row">
          <select value={activeLang} onChange={(event) => onLanguage(event.target.value)} className="min-h-12 rounded-xl border-white/15 bg-primary px-4 text-sm text-primary-foreground">
            {languages.map((language) => <option key={language.code} value={language.code}>{language.flag} {language.label}</option>)}
          </select>
          <button onClick={onDownload} disabled={exporting} className="flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground disabled:opacity-60">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {labels.download}
          </button>
        </div>
      </div>
    </header>
  );
}