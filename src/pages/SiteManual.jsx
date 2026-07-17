import React, { useEffect, useState } from "react";
import ManualHeader from "@/components/manual/ManualHeader";
import ManualToc from "@/components/manual/ManualToc";
import ManualChapter from "@/components/manual/ManualChapter";
import AuditSummary from "@/components/manual/AuditSummary";
import ManualLanguageSwitcher from "@/components/manual/ManualLanguageSwitcher";
import { MANUAL_UI_LABELS } from "@/lib/manualUiLabels";
import * as ar from "@/lib/siteManualContent.ar";
import * as en from "@/lib/siteManualContent.en";
import * as fr from "@/lib/siteManualContent.fr";
import * as es from "@/lib/siteManualContent.es";
import * as tr from "@/lib/siteManualContent.tr";
import * as ur from "@/lib/siteManualContent.ur";
import * as hi from "@/lib/siteManualContent.hi";
import * as bn from "@/lib/siteManualContent.bn";
import * as ru from "@/lib/siteManualContent.ru";

const CONTENT = { ar, en, fr, es, tr, ur, hi, bn, ru };
const RTL_LANGS = ["ar", "ur"];

export default function SiteManual() {
  const [lang, setLang] = useState(() => localStorage.getItem("manual_lang") || "ar");
  const activeLang = CONTENT[lang] ? lang : "ar";
  const content = CONTENT[activeLang];
  const labels = MANUAL_UI_LABELS[activeLang];

  useEffect(() => localStorage.setItem("manual_lang", activeLang), [activeLang]);

  return (
    <div dir={RTL_LANGS.includes(activeLang) ? "rtl" : "ltr"} className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8 print:bg-card print:p-0">
      <style>{`@media print{@page{size:A4;margin:14mm}.no-print{display:none!important}.manual-shell{max-width:none!important}.manual-chapter{break-inside:avoid;box-shadow:none!important}a{color:inherit!important;text-decoration:none!important}}`}</style>
      <main className="manual-shell mx-auto max-w-6xl space-y-6">
        <ManualLanguageSwitcher lang={activeLang} onChange={setLang} />
        <ManualHeader meta={content.MANUAL_META} labels={labels} />
        <ManualToc chapters={content.MANUAL_CHAPTERS} labels={labels} />
        {activeLang === "ar" && <AuditSummary />}
        {content.MANUAL_CHAPTERS.map((chapter) => <ManualChapter key={chapter.id} chapter={chapter} labels={labels} lang={activeLang} />)}
        <footer className="py-6 text-center text-xs text-muted-foreground">PowerCare — {labels.footer} · {labels.updated} {new Date().toLocaleDateString(activeLang)}</footer>
      </main>
    </div>
  );
}