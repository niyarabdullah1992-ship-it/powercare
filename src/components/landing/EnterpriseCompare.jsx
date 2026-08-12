import React from "react";
import { Link } from "react-router-dom";

/** Compare rows from NiroVera Landing.dc.html (traditional ERP vs NiroVera). */
const ROWS = [
  {
    ar: "مدة التطبيق",
    en: "Implementation time",
    legacyAr: "6 إلى 18 شهرًا",
    legacyEn: "6 to 18 months",
    nvAr: "أسبوعان",
    nvEn: "Two weeks",
  },
  {
    ar: "التدريب المطلوب",
    en: "Training required",
    legacyAr: "دورات لكل وحدة",
    legacyEn: "A course per module",
    nvAr: "الفني يسجّل حضوره من هاتفه بلا تدريب",
    nvEn: "Technicians check in from their phone with no training",
  },
  {
    ar: "اللغة والاتجاه",
    en: "Language and direction",
    legacyAr: "عربية مضافة على واجهة إنجليزية",
    legacyEn: "Arabic bolted onto an English interface",
    nvAr: "عربية أصلية من اليمين لليسار",
    nvEn: "Native right-to-left Arabic",
  },
  {
    ar: "العمل الميداني",
    en: "Field work",
    legacyAr: "إدخال لاحق من المكتب",
    legacyEn: "Entered later from the office",
    nvAr: "إثبات مصوّر مختوم بالموقع والوقت",
    nvEn: "Photo proof stamped with location and time",
  },
  {
    ar: "التكلفة السنوية",
    en: "Annual cost",
    legacyAr: "مئات الآلاف قبل التخصيص",
    legacyEn: "Hundreds of thousands before customization",
    nvAr: "اشتراك ثابت بلا رسوم تطبيق",
    nvEn: "A flat subscription with no implementation fee",
  },
];

/**
 * Design handoff compare — traditional ERP vs NiroVera (Landing.dc.html).
 */
export default function EnterpriseCompare({ ar }) {
  return (
    <section id="enterprise" className="bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
          {ar ? "مقابل أنظمة الموارد التقليدية" : "VS TRADITIONAL ERP"}
        </p>
        <h2 className="mt-2 max-w-[34rem] font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[34px]">
          {ar ? "مقارنة بأنظمة الموارد التقليدية" : "Compared with a traditional ERP"}
        </h2>
        <p className="mt-4 max-w-[36rem] text-[15px] leading-[1.9] text-[#5A6478]">
          {ar
            ? "الفرق ليس في عدد الشاشات — بل في سرعة التطبيق والعربية الأصيلة وإثبات الميدان."
            : "The difference is not more screens — it is time-to-value, native Arabic, and field proof."}
        </p>

        <div className="mt-10 overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-white">
          <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-[#EEF0F4] bg-[#0B1A3F] px-4 py-3 text-[11px] text-[#B9C3D8]">
            <span>{ar ? "المعيار" : "Criterion"}</span>
            <span>{ar ? "نظام موارد تقليدي" : "Traditional ERP"}</span>
            <span className="font-semibold text-[#9BE7C0]">NiroVera</span>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.en}
              className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 border-b border-[#F2F4F7] px-4 py-4 text-[13px] last:border-b-0"
            >
              <p className="font-medium text-[#101828]">{ar ? row.ar : row.en}</p>
              <p className="text-[#667085]">{ar ? row.legacyAr : row.legacyEn}</p>
              <p className="font-semibold text-[#0E7A4B]">{ar ? row.nvAr : row.nvEn}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/powercare-sap-comparison"
            className="rounded-[9px] bg-[#0B1A3F] px-4 py-2.5 text-[13px] text-white hover:bg-[#14233C]"
          >
            {ar ? "المستند التنفيذي الكامل" : "Full executive brief"}
          </Link>
          <a
            href="#demo"
            className="rounded-[9px] border border-[#E4E7EC] bg-white px-4 py-2.5 text-[13px] text-[#344054] hover:bg-[#EEF0F4]"
          >
            {ar ? "محطة واحدة، أسبوعان، بلا التزام" : "One station, two weeks, no commitment"}
          </a>
        </div>
      </div>
    </section>
  );
}
