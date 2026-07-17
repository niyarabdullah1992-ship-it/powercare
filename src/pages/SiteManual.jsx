import React from "react";
import ManualHeader from "@/components/manual/ManualHeader";
import { useI18n } from "@/lib/i18n";
import ManualToc from "@/components/manual/ManualToc";
import ManualChapter from "@/components/manual/ManualChapter";
import AuditSummary from "@/components/manual/AuditSummary";
import { MANUAL_UI_LABELS } from "@/lib/manualUiLabels";
import * as ar from "@/lib/siteManualContent.ar";
import * as en from "@/lib/siteManualContent.en";
import * as de from "@/lib/siteManualContent.de";
import * as fr from "@/lib/siteManualContent.fr";
import * as es from "@/lib/siteManualContent.es";
import * as pt from "@/lib/siteManualContent.pt";
import * as ru from "@/lib/siteManualContent.ru";
import * as ja from "@/lib/siteManualContent.ja";
import * as ko from "@/lib/siteManualContent.ko";

const CONTENT = { en, ar, de, fr, es, pt, ru, ja, ko };

export default function SiteManual() {
  const { lang, dir } = useI18n();
  const activeLang = CONTENT[lang] ? lang : "en";
  const content = CONTENT[activeLang];
  const labels = MANUAL_UI_LABELS[activeLang];

  return (
    <div dir={dir} className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8 print:bg-card print:p-0">
      <style>{`@media print{@page{size:A4;margin:14mm}.no-print{display:none!important}.manual-shell{max-width:none!important}.manual-chapter{break-inside:avoid;box-shadow:none!important}a{color:inherit!important;text-decoration:none!important}}`}</style>
      <main className="manual-shell mx-auto max-w-6xl space-y-6">
        <ManualHeader meta={content.MANUAL_META} labels={labels} />
        <ManualToc chapters={content.MANUAL_CHAPTERS} labels={labels} />
        {activeLang === "ar" && <AuditSummary />}
        {content.MANUAL_CHAPTERS.map((chapter) => <ManualChapter key={chapter.id} chapter={chapter} labels={labels} lang={activeLang} />)}
        <footer className="py-6 text-center text-xs text-muted-foreground">PowerCare — {labels.footer} · {labels.updated} {new Date().toLocaleDateString(activeLang)}</footer>
      </main>
    </div>
  );
}