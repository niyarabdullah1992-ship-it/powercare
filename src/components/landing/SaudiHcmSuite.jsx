import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

/**
 * Enterprise suite map — SAP/Oracle HCM thinking, Saudi MHRSD policy language.
 * One composition: connected modules feeding proof → payroll → oversight.
 * Not a card mall: horizontal flow + policy anchors.
 */
const MODULES = [
  { id: "org", ar: "الهيكل والصلاحيات", en: "Org & access", href: "/app/org" },
  { id: "att", ar: "الحضور والورديات", en: "Attendance & shifts", href: "/app/attendance" },
  { id: "ops", ar: "المهام والإثبات", en: "Tasks & proof", href: "/app/tasks" },
  { id: "hr", ar: "التوظيف والملف", en: "Hiring & file", href: "/app/hr" },
  { id: "pay", ar: "المسير وWPS", en: "Payroll & WPS", href: "/app/payroll" },
  { id: "gov", ar: "الرقابة والتوقيع", en: "Oversight & sign", href: "/app/signing" },
];

const POLICY = [
  {
    code: "MHRSD",
    arTitle: "نظام العمل",
    enTitle: "Labour Law",
    ar: "مواد الإجازات وساعات العمل ونهاية الخدمة تُشتق في القواعد — لا تُخزَّن كعبارات تسويقية.",
    en: "Leave articles, working hours and end-of-service are derived in rules — not stored as marketing copy.",
  },
  {
    code: "Qiwa",
    arTitle: "قوى",
    enTitle: "Qiwa",
    ar: "مطابقة الأجر والمسمى وخطوات التعيين/الإنهاء كبوابات بأسماء أسباب.",
    en: "Wage match, job title and hire/exit steps as named gates with reasons.",
  },
  {
    code: "GOSI",
    arTitle: "التأمينات",
    enTitle: "GOSI",
    ar: "ملف شهري مشتق من المسير ورقم المنشأة — جاهز للإرسال عند الاعتمادات.",
    en: "Monthly file derived from payroll and establishment number — send-ready when credentials exist.",
  },
  {
    code: "WPS",
    arTitle: "مدى / WPS",
    enTitle: "Mudad / WPS",
    ar: "هوية · آيبان · صافٍ · تطابق قوى — قبل أي إيداع.",
    en: "National ID · IBAN · net · Qiwa match — before any deposit.",
  },
];

export default function SaudiHcmSuite({ ar }) {
  return (
    <section id="suite" className="saudi-hcm-suite relative overflow-hidden bg-[#0B1A3F] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 100% 0%, rgba(14,122,75,0.35), transparent 55%), radial-gradient(ellipse 50% 40% at 0% 100%, rgba(59,130,246,0.12), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[80px]">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="text-[11px] font-semibold tracking-[0.2em] text-[#3FBF80]"
        >
          {ar ? "منظومة موارد بشرية سعودية" : "SAUDI HCM SUITE"}
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-3 max-w-[36rem] font-heading text-[28px] font-semibold leading-[1.25] tracking-[-0.02em] md:text-[36px]"
        >
          {ar
            ? "فكر المؤسسات العالمية — بقواعد وزارة الموارد البشرية"
            : "Enterprise HCM thinking — on Ministry of HR rules"}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-[34rem] text-[15px] leading-[1.9] text-[#B9C3D8]"
        >
          {ar
            ? "نيروفيرا ليست نسخة من SAP أو Oracle. هي منظومة عربية-أولى تربط الحضور والمهام والرواتب والامتثال في سلسلة واحدة قابلة للتدقيق — كما تتوقع جهة رقابية سعودية."
            : "NiroVera is not a SAP or Oracle clone. It is an Arabic-first suite that binds attendance, tasks, payroll and compliance into one auditable chain — as a Saudi oversight body expects."}
        </motion.p>

        <div className="saudi-hcm-flow mt-12 flex flex-wrap items-stretch gap-2 md:gap-0">
          {MODULES.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
              className="flex min-w-[140px] flex-1 items-center"
            >
              <Link
                to={m.href}
                className="group flex h-full w-full flex-col justify-between border border-white/15 bg-white/[0.04] px-4 py-4 transition hover:border-[#3FBF80]/50 hover:bg-white/[0.07]"
              >
                <span className="font-heading text-[10px] tracking-[0.16em] text-[#6B7C99]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-3 text-[14px] font-semibold leading-snug text-white group-hover:text-[#9BE7C0]">
                  {ar ? m.ar : m.en}
                </span>
              </Link>
              {i < MODULES.length - 1 && (
                <span className="hidden px-1 text-[#3FBF80] md:inline" aria-hidden>
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 border-t border-white/10 pt-12 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h3 className="font-heading text-[18px] font-semibold text-white">
              {ar ? "مراسي سياسة الدولة" : "State policy anchors"}
            </h3>
            <p className="mt-3 text-[13.5px] leading-[1.85] text-[#9AA6C0]">
              {ar
                ? "كل بوابة تُظهر سبب المنع بالنص. الأرقام تُشتق من المصدر. لا اعتماد صامت."
                : "Every gate shows its blocking reason in plain text. Numbers are derived from source. No silent approvals."}
            </p>
            <Link
              to="/powercare-sap-comparison"
              className="mt-6 inline-flex rounded-[9px] border border-white/20 px-4 py-2.5 text-[13px] text-white transition hover:bg-white/10"
            >
              {ar ? "مقارنة تنفيذية مع الأنظمة العالمية" : "Executive comparison vs global suites"}
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {POLICY.map((p, i) => (
              <motion.div
                key={p.code}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                className="border-s border-[#3FBF80]/45 ps-4"
              >
                <p className="font-heading text-[10px] tracking-[0.18em] text-[#3FBF80]">{p.code}</p>
                <h4 className="mt-1 text-[14px] font-semibold text-white">
                  {ar ? p.arTitle : p.enTitle}
                </h4>
                <p className="mt-1.5 text-[12.5px] leading-[1.75] text-[#9AA6C0]">
                  {ar ? p.ar : p.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
