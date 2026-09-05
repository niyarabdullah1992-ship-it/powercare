import React, { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { GUIDE_AUTHOR, GUIDE_PROGRAM, GUIDE_SECTIONS, GUIDE_PHILOSOPHY, GUIDE_INTERCONNECTION, GUIDE_PITCH, GUIDE_COVER_IMAGE, GUIDE_PHILOSOPHY_IMAGE } from "@/lib/projectGuideContent";
import { downloadElementPdf } from "@/lib/downloadElementPdf";
import ProjectGuideCover from "@/components/project-guide/ProjectGuideCover";
import ProjectGuideIntro from "@/components/project-guide/ProjectGuideIntro";
import ProjectGuideSection from "@/components/project-guide/ProjectGuideSection";
import ProjectGuideClosing from "@/components/project-guide/ProjectGuideClosing";

// Bilingual (Arabic + English) illustrated guide covering every section of the
// platform. Renders as a clean A4-style document; the button opens the
// browser's print dialog where the user chooses "Save as PDF".
export default function ProjectGuideDoc() {
  const documentRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const todayAr = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const todayEn = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  const downloadPdf = async () => {
    setDownloading(true);
    await downloadElementPdf(documentRef.current, "NiroVera-Booklet-Niyar-Alraniawi.pdf");
    setDownloading(false);
  };

  return (
    <div dir="rtl" className="powercare-public min-h-screen bg-secondary py-8 font-body print:bg-background print:py-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          .no-print { display: none !important; }
          .doc-sheet { box-shadow: none !important; margin: 0 !important; }
          .guide-page { break-after: page; page-break-after: always; min-height: 297mm !important; }
        }
        .guide-page { min-height: 1123px; }
      `}</style>

      <div className="no-print mx-auto mb-4 flex max-w-[794px] justify-end px-4">
        <button onClick={downloadPdf} disabled={downloading} className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm text-primary-foreground shadow-elevated hover:opacity-90 disabled:opacity-60">
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {downloading ? "جارٍ إنشاء الملف — Creating PDF" : "تحميل الملف PDF — Download PDF"}
        </button>
      </div>

      <div ref={documentRef} className="doc-sheet mx-auto w-[794px] max-w-full overflow-hidden bg-background shadow-elevated">
        <ProjectGuideCover program={GUIDE_PROGRAM} author={GUIDE_AUTHOR} dateAr={todayAr} dateEn={todayEn} image={GUIDE_COVER_IMAGE} />
        <ProjectGuideIntro philosophy={GUIDE_PHILOSOPHY} sections={GUIDE_SECTIONS} image={GUIDE_PHILOSOPHY_IMAGE} />
        {GUIDE_SECTIONS.map((section, index) => <ProjectGuideSection key={section.titleEn} section={section} index={index} />)}
        <ProjectGuideClosing interconnection={GUIDE_INTERCONNECTION} pitch={GUIDE_PITCH} author={GUIDE_AUTHOR} />
      </div>
    </div>
  );
}