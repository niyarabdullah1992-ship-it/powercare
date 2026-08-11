import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const CYCLE = [
  {
    n: "01",
    arTitle: "حضور موثّق",
    enTitle: "Verified attendance",
    arText: "الشخص والموقع والوقت في سجل واحد لا يُعاد كتابته.",
    enText: "Person, place and time in one immutable record.",
  },
  {
    n: "02",
    arTitle: "مهمة بوزن جهد",
    enTitle: "Weighted task",
    arText: "تنفيذ ميداني يُوزَن حسب الصعوبة — لا ساعات جلوس.",
    enText: "Field execution weighted by effort — not desk hours.",
  },
  {
    n: "03",
    arTitle: "إثبات وإقرار",
    enTitle: "Proof & attestation",
    arText: "مرفقات وقراءات وإقرار مكتوب من المنفّذ.",
    enText: "Attachments, readings and a written attestation.",
  },
  {
    n: "04",
    arTitle: "اعتماد متسلسل",
    enTitle: "Sequential approval",
    arText: "مدير ثم موارد بشرية — موافقة أو رفض بسبب مكتوب.",
    enText: "Manager then HR — approve or reject with a written reason.",
  },
  {
    n: "05",
    arTitle: "ختم للعميل",
    enTitle: "Client seal",
    arText: "بصمة رقمية قابلة للتحقق العام خارج المنصة.",
    enText: "A digital seal anyone can verify outside the app.",
  },
];

const SIGNALS = [
  {
    arTitle: "بوابة الحضور",
    enTitle: "Attendance gate",
    arText: "لا مهمة ميدانية بلا حضور موثّق في نفس اليوم.",
    enText: "No field task without verified attendance that day.",
  },
  {
    arTitle: "سلسلة لا تنقطع",
    enTitle: "Unbroken chain",
    arText: "من المنفّذ إلى المدير إلى العميل — حلقة واحدة.",
    enText: "From executor to manager to client — one chain.",
  },
  {
    arTitle: "تحقق SHA-256",
    enTitle: "SHA-256 verify",
    arText: "كل إثبات عمل يحمل بصمة يمكن لأي جهة فحصها.",
    enText: "Every client proof carries a hash anyone can check.",
  },
];

/**
 * Proof cycle as a journey timeline — the product idea, not a feature grid.
 */
export default function ProofCycleLanding({ lang = "ar" }) {
  const ar = lang === "ar";
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.18 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="proof-cycle" ref={ref} className="bg-[#0B1A3F]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-16 md:px-8 md:py-[80px]">
        <div className="max-w-[640px]">
          <p className="font-heading text-[11px] font-semibold tracking-[0.18em] text-[#3FBF80]">
            THE PROOF CYCLE
          </p>
          <h2 className="mt-3 font-heading text-[28px] font-semibold leading-snug text-white md:text-[36px]">
            {ar ? "دورة الإثبات — الفكرة التي بُنيت عليها المنصة" : "The Proof Cycle — the idea the platform is built on"}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.9] text-[#B9C3D8]">
            {ar
              ? "الأنظمة التقليدية تُفرّق الحضور في نظام، والمهام في آخر، والأداء في ثالث. نيروفيرا تجمعها في سلسلة واحدة يمكن لأي جهة رقابية تتبعها."
              : "Traditional stacks split attendance, tasks and performance. NiroVera binds them into one chain any oversight body can follow."}
          </p>
        </div>

        {/* Journey: horizontal on desktop, vertical on mobile */}
        <ol className="proof-journey relative grid gap-0 md:grid-cols-5">
          <span
            className="pointer-events-none absolute start-[1.15rem] top-3 bottom-3 w-px bg-[#1B2C55] md:start-0 md:end-0 md:top-[1.15rem] md:bottom-auto md:h-px md:w-auto"
            aria-hidden
          />
          {CYCLE.map((c, i) => (
            <li
              key={c.n}
              className={`proof-journey-step relative flex gap-4 pb-8 last:pb-0 md:flex-col md:gap-3 md:pb-0 md:pe-4 ${
                visible ? "is-visible" : ""
              }`}
              style={{ transitionDelay: visible ? `${i * 90}ms` : "0ms" }}
            >
              <span className="relative z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0E7A4B] font-heading text-xs font-semibold text-white">
                {c.n}
              </span>
              <div className="min-w-0 pt-0.5 md:pt-1">
                <h3 className="text-[15px] font-semibold text-white">{ar ? c.arTitle : c.enTitle}</h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.75] text-[#8FA1C2]">{ar ? c.arText : c.enText}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="grid gap-6 border-t border-[#1B2C55] pt-10 sm:grid-cols-3">
          {SIGNALS.map((s) => (
            <div key={s.enTitle} className="flex flex-col gap-1.5">
              <p className="text-[13.5px] font-semibold text-white">{ar ? s.arTitle : s.enTitle}</p>
              <p className="text-[12.5px] leading-[1.8] text-[#8FA1C2]">{ar ? s.arText : s.enText}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="#audience"
            className="rounded-[10px] bg-[#0E7A4B] px-6 py-3 text-[13.5px] font-medium text-white transition-colors hover:bg-[#0B5F3A]"
          >
            {ar ? "للشركات والجهات" : "For companies & government"}
          </a>
          <Link
            to="/proof"
            className="rounded-[10px] border border-[#1B2C55] px-6 py-3 text-[13.5px] text-[#B9C3D8] transition-colors hover:border-[#3FBF80] hover:text-white"
          >
            {ar ? "تحقق من ختم إثبات" : "Verify a proof seal"}
          </Link>
        </div>
      </div>
    </section>
  );
}
