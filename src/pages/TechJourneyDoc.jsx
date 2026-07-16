import React from "react";
import { Download } from "lucide-react";
import { TECH_DOC_META, TECH_DOC_SECTIONS } from "@/lib/techJourneyContent";
import Logo from "@/components/Logo";

// وثيقة تقنية مفصلة (A4 قابلة للطباعة/PDF): بداية المشروع، الربط الخارجي
// (Base44 + Supabase + Google + Stripe)، وكيف حُلّت المشاكل خطوة بخطوة.
export default function TechJourneyDoc() {
  const todayAr = new Date().toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div dir="rtl" className="min-h-screen bg-neutral-200 print:bg-white py-8 print:py-0 font-body">
      <style>{`
        @media print {
          @page { size: A4; margin: 16mm 14mm; }
          .no-print { display: none !important; }
          .doc-sheet { box-shadow: none !important; margin: 0 !important; max-width: none !important; }
          .doc-section { page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print max-w-[210mm] mx-auto mb-4 px-4 flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-landing-olive text-white text-sm hover:opacity-90 shadow"
        >
          <Download className="w-4 h-4" /> تحميل الملف PDF
        </button>
      </div>

      <div className="doc-sheet max-w-[210mm] mx-auto bg-white text-neutral-900 shadow-xl px-10 py-12 md:px-14 space-y-10">
        {/* الغلاف */}
        <div className="text-center space-y-4 border-b-2 border-neutral-800 pb-10">
          <div className="flex justify-center"><Logo size={64} /></div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading leading-relaxed">{TECH_DOC_META.titleAr}</h1>
          <p className="text-neutral-600">{TECH_DOC_META.subtitleAr}</p>
          <p className="text-neutral-400 text-sm" dir="ltr">{TECH_DOC_META.titleEn}</p>
          <div className="pt-4 space-y-1">
            <p className="text-sm text-neutral-500">إعداد صاحب المشروع</p>
            <p className="text-lg font-bold">{TECH_DOC_META.authorAr}</p>
            <p className="text-sm tracking-wide text-neutral-500" dir="ltr">{TECH_DOC_META.authorEn}</p>
          </div>
          <p className="text-xs text-neutral-500 pt-3">تاريخ الإصدار: {todayAr}</p>
        </div>

        {/* المحتويات */}
        <section className="doc-section space-y-3">
          <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">المحتويات</h2>
          <ol className="space-y-1.5 text-[14px] leading-7">
            {TECH_DOC_SECTIONS.map((s, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="font-semibold">{s.titleAr}</span>
                <span className="text-neutral-400 text-[12px]" dir="ltr">— {s.titleEn}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* الأقسام */}
        {TECH_DOC_SECTIONS.map((s, i) => (
          <section key={i} className="doc-section space-y-4 border-t border-neutral-200 pt-8">
            <h2 className="text-xl font-bold font-heading border-r-4 border-landing-gold pr-3">{s.titleAr}</h2>
            <p className="text-xs font-semibold text-neutral-400" dir="ltr">{s.titleEn}</p>

            {s.intro.map((p, j) => (
              <p key={j} className="text-[14.5px] leading-8 text-justify">{p}</p>
            ))}

            {s.points?.length > 0 && (
              <ul className="space-y-2">
                {s.points.map((p, j) => (
                  <li key={j} className="flex items-start gap-2 text-[14px] leading-8">
                    <span className="font-bold text-landing-gold-deep shrink-0">✦</span>
                    <span className="text-justify">{p}</span>
                  </li>
                ))}
              </ul>
            )}

            {s.problems?.length > 0 && (
              <div className="rounded-lg border border-neutral-300 bg-[#f7f1e6] p-4 space-y-3">
                <p className="font-bold text-[14px]">المشاكل التي واجهناها وكيف حُلّت:</p>
                {s.problems.map((pr, j) => (
                  <div key={j} className="space-y-1 text-[13.5px] leading-7">
                    <p><span className="font-bold text-red-800">⚠ المشكلة:</span> {pr.p}</p>
                    <p><span className="font-bold text-emerald-800">✔ الحل:</span> {pr.s}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))}

        {/* التذييل */}
        <p className="text-center text-[11px] text-neutral-400 border-t-2 border-neutral-800 pt-6">
          © {new Date().getFullYear()} {TECH_DOC_META.authorEn} — PowerCare. جميع الحقوق محفوظة — {TECH_DOC_META.authorAr}
        </p>
      </div>
    </div>
  );
}