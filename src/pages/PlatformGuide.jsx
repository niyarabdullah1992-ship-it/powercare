import React from "react";
import { BookOpen, Printer } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { guideChapters, guideMeta } from "@/lib/platformGuideContent";
import GuideToc from "@/components/guide/GuideToc";
import GuideChapter from "@/components/guide/GuideChapter";

export default function PlatformGuide() {
  const { lang, dir } = useI18n();
  const key = lang === "ar" ? "ar" : "en";
  const meta = guideMeta[key];
  const chapters = guideChapters.map((c) => ({ id: c.id, ...c[key] }));

  return (
    <div dir={dir} className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6">
      <header className="rounded-xl border border-accent/30 bg-primary p-6 text-primary-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-1 h-6 w-6 text-accent" />
            <div>
              <h1 className="font-heading text-2xl font-semibold">{meta.title}</h1>
              <p className="mt-1 text-sm text-primary-foreground/75">{meta.subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md border border-accent/50 px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-accent hover:text-accent-foreground print:hidden"
          >
            <Printer className="h-4 w-4" />
            {meta.print}
          </button>
        </div>
      </header>

      <GuideToc chapters={chapters} label={meta.toc} />

      <div className="space-y-4">
        {chapters.map((chapter, i) => (
          <GuideChapter key={chapter.id} index={i + 1} chapter={chapter} stepsLabel={meta.steps} />
        ))}
      </div>
    </div>
  );
}