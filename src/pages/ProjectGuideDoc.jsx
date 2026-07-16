import React from "react";
import { Download } from "lucide-react";
import { GUIDE_AUTHOR, GUIDE_PROGRAM, GUIDE_SECTIONS, GUIDE_PHILOSOPHY, GUIDE_INTERCONNECTION, GUIDE_PITCH } from "@/lib/projectGuideContent";
import Logo from "@/components/Logo";

// Bilingual (Arabic + English) illustrated guide covering every section of the
// platform. Renders as a clean A4-style document; the button opens the
// browser's print dialog where the user chooses "Save as PDF".
export default function ProjectGuideDoc() {
  const todayAr = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });
  const todayEn = new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-200 print:bg-white py-8 print:py-0 font-body">
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm; }
          .no-print { display: none !important; }
          .doc-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .guide-section { page-break-inside: avoid; }
          img { max-height: 62mm; }
        }
      `}</style>

      {/* Download button */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-landing-olive text-white text-sm hover:opacity-90 shadow"
        >
          <Download className="w-4 h-4" /> تحميل الملف PDF — Download PDF
        </button>
      </div>

      <div className="doc-sheet max-w-[210mm] mx-auto bg-white text-neutral-900 shadow-xl px-10 py-12 md:px-14 space-y-12">
        {/* Cover */}
        <div className="text-center space-y-4 border-b-2 border-neutral-800 pb-10">
          <div className="flex justify-center"><Logo size={64} /></div>
          <h1 className="text-3xl font-bold font-heading">{GUIDE_PROGRAM.nameAr}</h1>
          <p className="text-neutral-600">{GUIDE_PROGRAM.taglineAr}</p>
          <p className="text-neutral-500 text-sm" dir="ltr">{GUIDE_PROGRAM.nameEn} — {GUIDE_PROGRAM.taglineEn}</p>
          <p className="text-sm text-neutral-500 pt-2">الدليل التعريفي الشامل لأقسام المنصة — The Complete Platform Guide</p>
          <div className="pt-6 space-y-1">
            <p className="text-sm text-neutral-500">صاحب المشروع — Project Owner</p>
            <p className="text-xl font-bold">{GUIDE_AUTHOR.nameAr}</p>
            <p className="text-base tracking-wide" dir="ltr">{GUIDE_AUTHOR.nameEn}</p>
          </div>
          <p className="text-xs text-neutral-500 pt-4">
            تاريخ الإصدار: {todayAr} — Issued: <span dir="ltr">{todayEn}</span>
          </p>
        </div>

        {/* Philosophy — why the project was born */}
        <section className="guide-section space-y-4">
          <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">{GUIDE_PHILOSOPHY.titleAr}</h2>
          <p className="text-sm font-semibold text-neutral-500" dir="ltr">{GUIDE_PHILOSOPHY.titleEn}</p>
          <div className="space-y-2.5">
            {GUIDE_PHILOSOPHY.bodyAr.map((p, j) => (
              <p key={j} className="text-[14.5px] leading-8 text-justify">{p}</p>
            ))}
          </div>
          <div className="space-y-2.5 border-t border-dashed border-neutral-300 pt-4" dir="ltr">
            {GUIDE_PHILOSOPHY.bodyEn.map((p, j) => (
              <p key={j} className="text-[13.5px] leading-7 text-justify text-neutral-700">{p}</p>
            ))}
          </div>
        </section>

        {/* Table of contents */}
        <section className="guide-section space-y-3">
          <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">
            المحتويات — Contents
          </h2>
          <ol className="space-y-1.5 text-[14px] leading-7">
            {GUIDE_SECTIONS.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="font-bold text-landing-gold-deep shrink-0">{i + 1}.</span>
                <span className="font-semibold">{s.titleAr}</span>
                <span className="text-neutral-400 text-[12px]" dir="ltr">— {s.titleEn}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Sections */}
        {GUIDE_SECTIONS.map((s, i) => (
          <section key={i} className="guide-section space-y-4 border-t border-neutral-200 pt-8">
            <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">
              {i + 1}. {s.titleAr}
            </h2>
            <p className="text-sm font-semibold text-neutral-500" dir="ltr">{i + 1}. {s.titleEn}</p>
            <img
              src={s.image}
              alt={s.titleEn}
              className="w-full max-h-64 object-contain rounded-lg border border-neutral-200 bg-[#f7f1e6]"
            />
            <div className="space-y-2.5">
              {s.bodyAr.map((p, j) => (
                <p key={j} className="text-[14.5px] leading-8 text-justify">{p}</p>
              ))}
            </div>
            <div className="space-y-2.5 border-t border-dashed border-neutral-300 pt-4" dir="ltr">
              {s.bodyEn.map((p, j) => (
                <p key={j} className="text-[13.5px] leading-7 text-justify text-neutral-700">{p}</p>
              ))}
            </div>
          </section>
        ))}

        {/* Interconnection — how everything works as one body */}
        <section className="guide-section space-y-4 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">{GUIDE_INTERCONNECTION.titleAr}</h2>
          <p className="text-sm font-semibold text-neutral-500" dir="ltr">{GUIDE_INTERCONNECTION.titleEn}</p>
          <div className="space-y-2.5">
            {GUIDE_INTERCONNECTION.bodyAr.map((p, j) => (
              <p key={j} className="text-[14.5px] leading-8 text-justify">{p}</p>
            ))}
          </div>
          <div className="space-y-2.5 border-t border-dashed border-neutral-300 pt-4" dir="ltr">
            {GUIDE_INTERCONNECTION.bodyEn.map((p, j) => (
              <p key={j} className="text-[13.5px] leading-7 text-justify text-neutral-700">{p}</p>
            ))}
          </div>
        </section>

        {/* Business pitch — why companies should adopt PowerCare */}
        <section className="guide-section space-y-4 border-t border-neutral-200 pt-8">
          <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">{GUIDE_PITCH.titleAr}</h2>
          <p className="text-sm font-semibold text-neutral-500" dir="ltr">{GUIDE_PITCH.titleEn}</p>
          <ul className="space-y-2">
            {GUIDE_PITCH.pointsAr.map((p, j) => (
              <li key={j} className="flex items-start gap-2 text-[14.5px] leading-8">
                <span className="font-bold text-landing-gold-deep shrink-0">✦</span>
                <span className="text-justify">{p}</span>
              </li>
            ))}
          </ul>
          <ul className="space-y-2 border-t border-dashed border-neutral-300 pt-4" dir="ltr">
            {GUIDE_PITCH.pointsEn.map((p, j) => (
              <li key={j} className="flex items-start gap-2 text-[13.5px] leading-7 text-neutral-700">
                <span className="font-bold text-landing-gold-deep shrink-0">✦</span>
                <span className="text-justify">{p}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-neutral-300 bg-[#f7f1e6] p-5 text-center space-y-1.5">
            <p className="font-bold text-[15px]">{GUIDE_PITCH.contactAr} — <span dir="ltr">{GUIDE_PITCH.contactEn}</span></p>
            <p className="text-sm font-semibold">{GUIDE_AUTHOR.nameAr}</p>
            <p className="text-sm tracking-wide" dir="ltr">{GUIDE_AUTHOR.nameEn}</p>
            <p className="text-sm" dir="ltr">{GUIDE_PITCH.phone} · {GUIDE_PITCH.emails.join(" · ")}</p>
          </div>
        </section>

        {/* Footer */}
        <p className="text-center text-[11px] text-neutral-400 border-t-2 border-neutral-800 pt-6">
          © {new Date().getFullYear()} {GUIDE_AUTHOR.nameEn} — {GUIDE_PROGRAM.nameEn}. All rights reserved. جميع الحقوق محفوظة — {GUIDE_AUTHOR.nameAr}
        </p>
      </div>
    </div>
  );
}