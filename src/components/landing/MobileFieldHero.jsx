import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Brand-first field companion hero — one promise, two CTAs, no cards or stats.
 */
export default function MobileFieldHero({ ar }) {
  const fade = {
    hidden: { opacity: 0, y: 16 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.1 + i * 0.09, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section className="mobile-field-hero relative isolate min-h-[min(78vh,680px)] overflow-hidden bg-[#0B1A3F]">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(14,122,75,0.28),transparent_55%),linear-gradient(160deg,#0B1A3F_0%,#08142F_55%,#0B1A3F_100%)]"
        aria-hidden
      />
      <div className="institutional-hero-mesh pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -start-24 top-24 h-72 w-72 rounded-full bg-[#0E7A4B]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -end-16 bottom-0 h-80 w-80 rounded-full bg-[#3FBF80]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[min(78vh,680px)] max-w-[1200px] flex-col justify-end px-6 pb-14 pt-28 md:px-8 md:pb-20 md:pt-32">
        <div className="max-w-[640px]">
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate="show"
            className="font-heading text-[11px] font-semibold tracking-[0.2em] text-[#3FBF80] md:text-xs"
          >
            {ar ? "تطبيق الفني الميداني" : "FIELD TECHNICIAN COMPANION"}
          </motion.p>

          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-4 font-heading text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[58px] md:text-[72px]"
          >
            NiroVera
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-[32rem] text-[17px] leading-[1.7] text-[#B9C3D8] md:text-[19px]"
          >
            {ar
              ? "ما يراه الفني في المحطة: أربع شاشات ليوم عمل كامل — حضور، مهام، إغلاق بالصورة، وبلاغ مجهول."
              : "What the field technician sees on site: four screens for a full workday — attendance, tasks, photo close-out, and anonymous report."}
          </motion.p>

          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="#field-screens"
              className="institutional-cta rounded-[10px] bg-[#0E7A4B] px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#0B5F3A]"
            >
              {ar ? "شاهد الشاشات الأربع" : "See the four screens"}
            </a>
            <Link
              to="/login"
              state={{ from: "/app/attendance" }}
              className="rounded-[10px] border border-white/25 bg-white/5 px-7 py-3.5 text-[15px] text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              {ar ? "دخول الميدان" : "Enter the field"}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
