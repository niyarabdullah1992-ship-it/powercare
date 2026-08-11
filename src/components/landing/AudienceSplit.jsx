import React from "react";
import { Building2, Landmark } from "lucide-react";

const COMPANY = {
  arTitle: "للشركات",
  enTitle: "For companies",
  arLead: "عندما يتوزّع العمل على محطات وفرق ميدانية، يصبح التسجيل وحده غير كافٍ.",
  enLead: "When work spans stations and field teams, logging alone is not enough.",
  pointsAr: [
    "حضور بموقع يغذي المهام والمسير",
    "وزن جهد يعكس صعوبة العمل لا ساعات المكتب",
    "ختم عميل يثبت إنجاز الخدمة ميدانيًا",
    "محطات متعددة بلا فوضى صلاحيات",
  ],
  pointsEn: [
    "Location attendance feeds tasks and payroll",
    "Effort weight reflects real work — not desk hours",
    "Client seal proves the service was delivered on site",
    "Multi-station ops without permission chaos",
  ],
};

const GOV = {
  arTitle: "للجهات الحكومية",
  enTitle: "For government",
  arLead: "القرار الإداري يحتاج أثرًا مكتوبًا يمكن مراجعته — لا انطباعًا ولا شاشة مزدحمة.",
  enLead: "Administrative decisions need a written trail that can be audited — not impressions or cluttered screens.",
  pointsAr: [
    "فصل أدوار صارم: منفّذ، مدير، موارد بشرية، تنفيذي",
    "اعتماد أو رفض بسبب مكتوب في كل حلقة",
    "تقارير جاهزة للرقابة والتدقيق الداخلي",
    "واجهة عربية أولًا تناسب بيئة العمل الرسمية",
  ],
  pointsEn: [
    "Strict role separation: executor, manager, HR, executive",
    "Approve or reject with a written reason at every step",
    "Reports ready for oversight and internal audit",
    "Arabic-first UI suited to formal workplaces",
  ],
};

/**
 * Equal-weight dual audience — companies vs government decision-makers.
 */
export default function AudienceSplit({ ar }) {
  const blocks = [
    { ...COMPANY, Icon: Building2, tone: "light" },
    { ...GOV, Icon: Landmark, tone: "navy" },
  ];

  return (
    <section id="audience" className="border-y border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[80px]">
        <div className="mb-10 max-w-[640px]">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
            {ar ? "جمهور القرار" : "DECISION AUDIENCE"}
          </p>
          <h2 className="mt-2 font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[34px]">
            {ar ? "نفس دورة الإثبات — بلغة من يقرّر" : "The same proof cycle — in the language of who decides"}
          </h2>
          <p className="mt-3 text-[15px] leading-[1.85] text-[#5A6478]">
            {ar
              ? "نواة واحدة للمنصة، وضبط مختلف لما يهم الشركة وما تطلبه الجهة الحكومية من حوكمة ورقابة."
              : "One product core — tuned to what companies need to run, and what government needs to govern."}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {blocks.map((b) => {
            const navy = b.tone === "navy";
            return (
              <article
                key={b.enTitle}
                className={`flex flex-col gap-5 border-t-2 pt-7 ${
                  navy ? "border-[#0E7A4B]" : "border-[#0B1A3F]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <b.Icon
                    className={`h-5 w-5 ${navy ? "text-[#0E7A4B]" : "text-[#0B1A3F]"}`}
                    strokeWidth={1.6}
                  />
                  <h3 className="text-[20px] font-semibold text-[#0B1A3F]">
                    {ar ? b.arTitle : b.enTitle}
                  </h3>
                </div>
                <p className="text-[15px] leading-[1.85] text-[#5A6478]">
                  {ar ? b.arLead : b.enLead}
                </p>
                <ul className="flex flex-col gap-3">
                  {(ar ? b.pointsAr : b.pointsEn).map((p) => (
                    <li key={p} className="flex items-start gap-3 text-[13.5px] leading-[1.7] text-[#344054]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E7A4B]" />
                      {p}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
