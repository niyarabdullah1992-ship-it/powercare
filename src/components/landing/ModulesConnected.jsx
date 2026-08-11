import React from "react";

const MODULES = [
  { ar: "مركز القيادة", en: "Command Center" },
  { ar: "العمليات", en: "Operations" },
  { ar: "الحضور", en: "Attendance" },
  { ar: "الورديات", en: "Shifts" },
  { ar: "إثبات العمل", en: "Work Proof" },
  { ar: "التقرير اليومي", en: "Daily Report" },
  { ar: "السلامة", en: "Safety HSE" },
  { ar: "المخزون", en: "Inventory" },
  { ar: "المحادثات", en: "Chat" },
  { ar: "الموارد البشرية", en: "HR" },
  { ar: "الملفات", en: "Files" },
  { ar: "الهيكل", en: "Org" },
  { ar: "الإجازات", en: "Leave" },
  { ar: "الأداء", en: "Performance" },
  { ar: "الرواتب", en: "Payroll" },
  { ar: "المصروفات", en: "Expenses" },
  { ar: "التوقيع", en: "Signing" },
  { ar: "الشكاوى", en: "Complaints" },
  { ar: "التوظيف", en: "Hiring" },
  { ar: "التقارير", en: "Reports" },
  { ar: "المساعد", en: "Assistant" },
];

/**
 * One job: show that modules share one data spine — not a feature-card mall.
 */
export default function ModulesConnected({ ar }) {
  return (
    <section id="modules" className="border-y border-[#E4E7EC] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
        <div className="max-w-[720px]">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
            {ar ? "قاعدة واحدة" : "ONE DATABASE"}
          </p>
          <h2 className="mt-2 font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[34px]">
            {ar ? "إحدى وعشرون وحدة — مصدر حقيقة واحد" : "Twenty-one modules — one source of truth"}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.85] text-[#5A6478]">
            {ar
              ? "تسجيل حضور واحد يغذّي الجدولة والرواتب والأداء والتقارير معًا — دون إعادة إدخال ولا تصدير واستيراد."
              : "A single check-in feeds scheduling, payroll, performance and reporting together — no re-entry, no export-import."}
          </p>
        </div>

        <ul className="mt-10 flex flex-wrap gap-x-1 gap-y-3">
          {MODULES.map((m, i) => (
            <li key={m.en} className="flex items-center text-[13.5px] text-[#344054]">
              {i > 0 && (
                <span className="mx-2.5 text-[#CBD5E1]" aria-hidden>
                  ·
                </span>
              )}
              <span className={i === 0 ? "font-semibold text-[#0B1A3F]" : ""}>
                {ar ? m.ar : m.en}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
