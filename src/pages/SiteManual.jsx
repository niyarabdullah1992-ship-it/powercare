import React, { useEffect, useMemo, useRef, useState } from "react";
import ManualHeader from "@/components/manual/ManualHeader";
import ManualToc from "@/components/manual/ManualToc";
import ManualChapter from "@/components/manual/ManualChapter";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { allowedNavFor } from "@/lib/navVisibility";
import { MANUAL_UI_LABELS } from "@/lib/manualUiLabels";
import { MANUAL_SECTIONS } from "@/lib/siteManualBuilder";
import { downloadManualPdf } from "@/lib/downloadManualPdf";
import * as ar from "@/lib/siteManualContent.ar";
import * as en from "@/lib/siteManualContent.en";
import * as de from "@/lib/siteManualContent.de";
import * as fr from "@/lib/siteManualContent.fr";
import * as es from "@/lib/siteManualContent.es";
import * as pt from "@/lib/siteManualContent.pt";
import * as ru from "@/lib/siteManualContent.ru";
import * as ja from "@/lib/siteManualContent.ja";
import * as ko from "@/lib/siteManualContent.ko";
import * as ur from "@/lib/siteManualContent.ur";
import * as hi from "@/lib/siteManualContent.hi";
import * as bn from "@/lib/siteManualContent.bn";
import * as tr from "@/lib/siteManualContent.tr";

const CONTENT = { en, ar, de, fr, es, pt, ru, ja, ko, ur, hi, bn, tr };
const MANUAL_LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "ur", label: "اردو", flag: "🇵🇰" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇧🇩" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷" },
];
const ROUTES = Object.fromEntries(MANUAL_SECTIONS);

export default function SiteManual() {
  const { lang } = useI18n();
  const { currentUser, data } = useAuth();
  const [manualLang, setManualLang] = useState(CONTENT[lang] ? lang : "en");
  const [exporting, setExporting] = useState(false);
  const manualRef = useRef(null);

  useEffect(() => {
    if (CONTENT[lang]) setManualLang(lang);
  }, [lang]);

  const content = CONTENT[manualLang];
  const labels = MANUAL_UI_LABELS[manualLang];

  const allowed = useMemo(() => currentUser ? allowedNavFor(currentUser, data) : null, [currentUser, data]);
  const chapters = content.MANUAL_CHAPTERS.filter((chapter) => ROUTES[chapter.id] && (!allowed || allowed.has(ROUTES[chapter.id]))).map((chapter, index) => {
    const name = chapter.name || chapter.title.replace(/^\d+\.\s*/, "");
    return { ...chapter, route: ROUTES[chapter.id], number: index + 1, name, title: `${index + 1}. ${name}` };
  });

  const exportPdf = async () => {
    setExporting(true);
    try {
      const started = Date.now();
      await new Promise((resolve) => {
        const wait = () => {
          const shots = [...document.querySelectorAll(".manual-screen-shot")];
          if ((shots.length && shots.every((shot) => shot.dataset.captureReady)) || Date.now() - started > 15000) resolve();
          else setTimeout(wait, 250);
        };
        setTimeout(wait, 250);
      });
      await downloadManualPdf(manualRef.current, `PowerCare-Manual-${manualLang}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div dir={["ar", "ur"].includes(manualLang) ? "rtl" : "ltr"} className="text-foreground print:bg-card">
      <style>{`@media print{@page{size:A4;margin:12mm}.no-print{display:none!important}.manual-chapter{break-inside:avoid;box-shadow:none!important}}`}</style>
      <div ref={manualRef} className="manual-shell mx-auto max-w-[1500px] space-y-6">
        <ManualHeader meta={content.MANUAL_META} labels={labels} languages={MANUAL_LANGUAGES} activeLang={manualLang} onLanguage={setManualLang} onDownload={exportPdf} exporting={exporting} />
        <div className="grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <ManualToc chapters={chapters} labels={labels} />
          <main className="space-y-6">{chapters.map((chapter) => <ManualChapter key={chapter.id} chapter={chapter} labels={labels} lang={manualLang} exportMode={exporting} />)}</main>
        </div>
        <footer className="py-6 text-center text-xs text-muted-foreground">PowerCare — {labels.footer} · {labels.updated} {new Date().toLocaleDateString(manualLang)}</footer>
      </div>
    </div>
  );
}