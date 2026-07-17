import React from "react";
import ManualHeader from "@/components/manual/ManualHeader";
import ManualToc from "@/components/manual/ManualToc";
import ManualChapter from "@/components/manual/ManualChapter";
import AuditSummary from "@/components/manual/AuditSummary";
import { MANUAL_CHAPTERS } from "@/lib/siteManualContent";

export default function SiteManual() {
  return (
    <div dir="rtl" className="min-h-screen bg-background px-4 py-6 text-foreground md:px-8 print:bg-card print:p-0">
      <style>{`@media print{@page{size:A4;margin:14mm}.no-print{display:none!important}.manual-shell{max-width:none!important}.manual-chapter{break-inside:avoid;box-shadow:none!important}a{color:inherit!important;text-decoration:none!important}}`}</style>
      <main className="manual-shell mx-auto max-w-6xl space-y-6"><ManualHeader /><ManualToc /><AuditSummary />{MANUAL_CHAPTERS.map((chapter) => <ManualChapter key={chapter.id} chapter={chapter} />)}<footer className="py-6 text-center text-xs text-muted-foreground">PowerCare — الدليل التشغيلي الشامل · آخر تحديث {new Date().toLocaleDateString("ar-SA")}</footer></main>
    </div>
  );
}