import React from "react";
import { Link } from "react-router-dom";

const ROWS = [
  {
    ar: "عمق HCM يومي (حضور · مهام · إثبات)",
    en: "Daily HCM depth (attendance · tasks · proof)",
    nv: "core",
    sap: "strong",
    noteAr: "نيروفيرا مصممة للحقل السعودي أولًا",
    noteEn: "NiroVera is field-Saudi first",
  },
  {
    ar: "امتثال وزارة الموارد / قوى / GOSI / WPS",
    en: "MHRSD / Qiwa / GOSI / WPS compliance",
    nv: "native",
    sap: "localized",
    noteAr: "قواعد مشتقة وبوابات بأسماء أسباب",
    noteEn: "Derived rules and named gates",
  },
  {
    ar: "عربية أولًا وRTL أصيل",
    en: "Arabic-first native RTL",
    nv: "native",
    sap: "add-on",
    noteAr: "واجهة وتشغيل بالعربية من الأساس",
    noteEn: "UI and ops Arabic from the ground up",
  },
  {
    ar: "دورة إثبات قابلة للتحقق (ختم عميل)",
    en: "Verifiable proof cycle (client seal)",
    nv: "native",
    sap: "weak",
    noteAr: "SHA-256 ورابط تحقق عام",
    noteEn: "SHA-256 and public verify link",
  },
  {
    ar: "مالية FI/CO عالمية",
    en: "Global FI/CO finance",
    nv: "out",
    sap: "strong",
    noteAr: "خارج نطاق نيروفيرا عمدًا",
    noteEn: "Intentionally out of NiroVera scope",
  },
];

const CELL = {
  core: { ar: "مركز المنتج", en: "Product core", tone: "#0E7A4B" },
  native: { ar: "أصلي", en: "Native", tone: "#0E7A4B" },
  strong: { ar: "قوي", en: "Strong", tone: "#344054" },
  localized: { ar: "توطين لاحق", en: "Later localization", tone: "#B54708" },
  "add-on": { ar: "إضافة", en: "Add-on", tone: "#B54708" },
  weak: { ar: "ضعيف", en: "Weak", tone: "#98A2B3" },
  out: { ar: "خارج النطاق", en: "Out of scope", tone: "#98A2B3" },
};

/**
 * Honest SAP/Oracle comparison — one job: position without claiming full ERP.
 */
export default function EnterpriseCompare({ ar }) {
  return (
    <section id="enterprise" className="bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
          {ar ? "مقابل SAP وOracle" : "VS SAP & ORACLE"}
        </p>
        <h2 className="mt-2 max-w-[34rem] font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[34px]">
          {ar
            ? "عمق مؤسساتي حيث يهم — دون ادعاء ERP مالي كامل"
            : "Institutional depth where it matters — without claiming full financial ERP"}
        </h2>
        <p className="mt-4 max-w-[36rem] text-[15px] leading-[1.9] text-[#5A6478]">
          {ar
            ? "الأنظمة العالمية قوية في المالية العالمية. نيروفيرا قوية في تشغيل الموارد البشرية السعودي المربوط بالإثبات والامتثال."
            : "Global suites are strong in worldwide finance. NiroVera is strong in Saudi HR operations bound to proof and compliance."}
        </p>

        <div className="mt-10 overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-white">
          <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 border-b border-[#EEF0F4] bg-[#0B1A3F] px-4 py-3 text-[11px] text-[#B9C3D8]">
            <span>{ar ? "البُعد" : "Dimension"}</span>
            <span className="font-semibold text-[#9BE7C0]">NiroVera</span>
            <span>{ar ? "SAP / Oracle" : "SAP / Oracle"}</span>
          </div>
          {ROWS.map((row) => (
            <div
              key={row.en}
              className="grid grid-cols-[1.5fr_1fr_1fr] gap-2 border-b border-[#F2F4F7] px-4 py-4 text-[13px] last:border-b-0"
            >
              <div>
                <p className="font-medium text-[#101828]">{ar ? row.ar : row.en}</p>
                <p className="mt-1 text-[11.5px] text-[#667085]">{ar ? row.noteAr : row.noteEn}</p>
              </div>
              <span style={{ color: CELL[row.nv].tone }} className="font-semibold">
                {ar ? CELL[row.nv].ar : CELL[row.nv].en}
              </span>
              <span style={{ color: CELL[row.sap].tone }}>
                {ar ? CELL[row.sap].ar : CELL[row.sap].en}
              </span>
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
            {ar ? "اطلب عرضًا للمؤسسات" : "Request an enterprise demo"}
          </a>
        </div>
      </div>
    </section>
  );
}
