import React from "react";
import { Link } from "react-router-dom";

const CYCLE = [
  {
    n: "1",
    arTitle: "حضور موثّق",
    enTitle: "Verified attendance",
    arText: "بصمة وموقع ووقت في سجل واحد لا يُعاد كتابته.",
    enText: "Fingerprint, place and time in one immutable record.",
  },
  {
    n: "2",
    arTitle: "مهمة بوزن جهد",
    enTitle: "Weighted task",
    arText: "كل مهمة تُوزَن حسب صعوبتها وميدانيتها.",
    enText: "Every task is weighted by effort and field demand.",
  },
  {
    n: "3",
    arTitle: "إثبات وإقرار",
    enTitle: "Proof & attestation",
    arText: "مرفقات وقراءات وإقرار مكتوب من المنفّذ.",
    enText: "Attachments, readings and a written attestation.",
  },
  {
    n: "4",
    arTitle: "اعتماد متسلسل",
    enTitle: "Sequential approval",
    arText: "موافقة أو رفض بسبب مكتوب — بلا انطباع.",
    enText: "Approve or reject with a written reason — no guesswork.",
  },
  {
    n: "5",
    arTitle: "ختم للعميل",
    enTitle: "Client seal",
    arText: "بصمة رقمية قابلة للتحقق العام خارج المنصة.",
    enText: "A digital seal anyone can verify outside the app.",
  },
];

const PILLARS = [
  {
    arTitle: "وزن الجهد",
    enTitle: "Effort weight",
    arText: "النقاط تُحسب من صعوبة المهمة لا من ساعات الجلوس.",
    enText: "Points follow task difficulty — not desk hours.",
  },
  {
    arTitle: "بوابة الحضور",
    enTitle: "Attendance gate",
    arText: "لا مهمة ميدانية بلا حضور موثّق في نفس اليوم.",
    enText: "No field task without verified attendance that day.",
  },
  {
    arTitle: "سلسلة الاعتماد",
    enTitle: "Approval chain",
    arText: "من المنفّذ إلى المدير إلى العميل — حلقة واحدة.",
    enText: "From executor to manager to client — one chain.",
  },
  {
    arTitle: "SHA-256 للتحقق",
    enTitle: "SHA-256 verify",
    arText: "كل إثبات عمل يحمل بصمة يمكن لأي جهة فحصها.",
    enText: "Every client proof carries a hash anyone can check.",
  },
  {
    arTitle: "عربية أولًا",
    enTitle: "Arabic-first",
    arText: "واجهة وقرارات وتقارير بالعربية مع 9 لغات.",
    enText: "UI, decisions and reports in Arabic — plus 9 languages.",
  },
  {
    arTitle: "امتثال سعودي",
    enTitle: "Saudi compliance",
    arText: "WPS والحوكمة والملكية الفكرية في صميم المنتج.",
    enText: "WPS, governance and IP protection built into the product.",
  },
];

/**
 * Public “THE NIROVERA CYCLE” block — from Claude Website handoff, wired into Landing.
 */
export default function ProofCycleLanding({ lang = "ar" }) {
  const ar = lang === "ar";

  return (
    <section id="proof-cycle" className="bg-[#0B1A3F]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-16 md:px-8 md:py-[72px]">
        <div className="flex max-w-[720px] flex-col gap-2.5">
          <span className="font-heading text-[12.5px] font-semibold tracking-[0.14em] text-[#3FBF80]">
            THE NIROVERA CYCLE
          </span>
          <h2 className="m-0 text-[28px] font-bold leading-snug text-white md:text-[34px]">
            {ar ? "دورة الإثبات — الفكرة التي بُنيت عليها المنصة" : "The Proof Cycle — the idea the platform is built on"}
          </h2>
          <p className="m-0 text-[15px] leading-[1.9] text-[#B9C3D8]">
            {ar
              ? "في الأنظمة التقليدية يُسجَّل الحضور في نظام والمهام في آخر والأداء في ثالث. في نيروفيرا هي سلسلة واحدة لا تنقطع:"
              : "Traditional stacks split attendance, tasks and performance. In NiroVera they are one unbroken chain:"}
          </p>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
          {CYCLE.map((c) => (
            <div
              key={c.n}
              className="flex flex-col gap-2.5 rounded-xl border border-[#1B2C55] bg-[#0D1D42] p-5"
            >
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#0E7A4B] font-heading text-sm font-semibold text-white">
                {c.n}
              </span>
              <span className="text-[15px] font-semibold text-white">{ar ? c.arTitle : c.enTitle}</span>
              <span className="text-[12.8px] leading-[1.8] text-[#8FA1C2]">{ar ? c.arText : c.enText}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((p) => (
            <div key={p.enTitle} className="flex items-start gap-3 rounded-[10px] border border-[#1B2C55] p-4">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3FBF80]" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white">{ar ? p.arTitle : p.enTitle}</span>
                <span className="text-[12.5px] leading-[1.8] text-[#8FA1C2]">{ar ? p.arText : p.enText}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-[10px] bg-[#0E7A4B] px-6 py-3 text-[13.5px] font-medium text-white hover:bg-[#0B5F3A]"
          >
            {ar ? "دخول المنصة" : "Enter platform"}
          </Link>
          <a
            href="#sectors"
            className="rounded-[10px] border border-[#1B2C55] bg-transparent px-6 py-3 text-[13.5px] text-[#B9C3D8] hover:border-[#3FBF80] hover:text-white"
          >
            {ar ? "استكشف القطاعات" : "Explore sectors"}
          </a>
        </div>
      </div>
    </section>
  );
}
