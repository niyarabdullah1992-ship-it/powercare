import React from "react";
import { Link } from "react-router-dom";

const ITEMS = [
  {
    arTitle: "وزارة الموارد البشرية",
    enTitle: "Ministry of HR (MHRSD)",
    arText: "مواد نظام العمل للإجازات والساعات ونهاية الخدمة تُطبَّق كبوابات مشتقة — لا شعارات فقط.",
    enText: "Labour-law articles for leave, hours and end-of-service run as derived gates — not slogans.",
  },
  {
    arTitle: "قوى · التأمينات · WPS",
    enTitle: "Qiwa · GOSI · WPS",
    arText: "مطابقة الأجر، ملف GOSI الشهري، وصفوف مدى/WPS (هوية وآيبان) قبل الإيداع.",
    enText: "Wage match, monthly GOSI file, and Mudad/WPS rows (ID & IBAN) before deposit.",
  },
  {
    arTitle: "نِطاقات والملف النظامي",
    enTitle: "Nitaqat & statutory file",
    arText: "نسبة السعودة مشتقة من الرأس؛ تنبيه انتهاء الوثائق خلال ٦٠ يومًا باسم الوثيقة.",
    enText: "Saudization rate derived from headcount; 60-day document expiry named by document.",
  },
  {
    arTitle: "تحقق عام للختم",
    enTitle: "Public seal verify",
    arText: "الجهة الرقابية أو العميل تتحقق من الختم دون دخول للمنصة.",
    enText: "An oversight body or client verifies the seal without logging into the platform.",
  },
];

/**
 * Trust strip tied to the proof cycle — calm, not a card grid spam.
 */
export default function TrustCompliance({ ar }) {
  return (
    <section id="trust" className="bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-end">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
              {ar ? "ثقة ورقابة" : "TRUST & OVERSIGHT"}
            </p>
            <h2 className="mt-2 font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[34px]">
              {ar ? "سياسة الدولة داخل التشغيل" : "State policy inside operations"}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-[1.9] text-[#5A6478]">
              {ar
                ? "الامتثال ليس صفحة منفصلة — هو بوابات في الحضور والتوظيف والمسير والتوقيع، مع أثر تدقيق لكل قرار."
                : "Compliance is not a separate page — it is gates in attendance, hiring, payroll and signing, with an audit trail on every decision."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/security"
                className="rounded-[9px] border border-[#E4E7EC] bg-[#F7F8FA] px-4 py-2.5 text-[13px] text-[#344054] hover:bg-[#EEF0F4]"
              >
                {ar ? "الأمان والامتثال" : "Security & compliance"}
              </Link>
              <Link
                to="/proof"
                className="rounded-[9px] bg-[#0B1A3F] px-4 py-2.5 text-[13px] text-white hover:bg-[#14233C]"
              >
                {ar ? "صفحة التحقق العام" : "Public verify page"}
              </Link>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
            {ITEMS.map((item, i) => (
              <div key={item.enTitle} className="border-s-2 border-[#0E7A4B]/35 ps-4">
                <p className="font-heading text-[11px] tracking-[0.12em] text-[#98A2B3]">0{i + 1}</p>
                <h3 className="mt-1 text-[15px] font-semibold text-[#0B1A3F]">{ar ? item.arTitle : item.enTitle}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.75] text-[#5A6478]">{ar ? item.arText : item.enText}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
