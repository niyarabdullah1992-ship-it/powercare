import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";

const HERO_IMAGE =
  "https://media.base44.com/images/public/6a4f617bd7360a0ae9581d2a/573c53f75_generated_image.png";

/**
 * Full-bleed institutional hero — brand first, one proof promise, CTAs only.
 * No stats, cards, or floating badges.
 */
export default function InstitutionalHero({ ar }) {
  const fade = {
    hidden: { opacity: 0, y: 18 },
    show: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.12 + i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  return (
    <section className="institutional-hero relative isolate min-h-[min(92vh,820px)] overflow-hidden bg-[#0B1A3F]">
      <Image
        src={HERO_IMAGE}
        alt={ar ? "بيئة عمل مؤسسية" : "Institutional workplace"}
        originWidth={1536}
        originHeight={864}
        fittingType="fill"
        quality={90}
        className="absolute inset-0 h-full w-full scale-105 object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#08142F] via-[#0B1A3F]/88 to-[#0B1A3F]/55"
        aria-hidden
      />
      <div
        className="institutional-hero-mesh pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-[min(92vh,820px)] max-w-[1200px] flex-col justify-end px-6 pb-16 pt-28 md:px-8 md:pb-24 md:pt-32">
        <div className="max-w-[720px]">
          <motion.p
            custom={0}
            variants={fade}
            initial="hidden"
            animate="show"
            className="font-heading text-[11px] font-semibold tracking-[0.22em] text-[#3FBF80] md:text-xs"
          >
            POWERCARE · NIROVERA
          </motion.p>

          <motion.h1
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-4 font-heading text-[48px] font-semibold leading-[1.05] tracking-[-0.03em] text-white sm:text-[64px] md:text-[80px]"
          >
            NiroVera
          </motion.h1>

          <motion.p
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-[34rem] text-[18px] leading-[1.7] text-[#B9C3D8] md:text-[20px]"
          >
            {ar
              ? "منظومة موارد بشرية سعودية: حضور · مهام · رواتب · امتثال وزارة الموارد — بإثبات قابل للتحقق."
              : "A Saudi HR suite: attendance · tasks · payroll · Ministry compliance — with verifiable proof."}
          </motion.p>

          <motion.div
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="#demo"
              className="institutional-cta rounded-[10px] bg-[#0E7A4B] px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#0B5F3A]"
            >
              {ar ? "اطلب عرضًا رسميًا" : "Request a formal briefing"}
            </a>
            <Link
              to="/login"
              className="rounded-[10px] border border-white/25 bg-white/5 px-7 py-3.5 text-[15px] text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              {ar ? "دخول الشركة أو الجهة" : "Company or government login"}
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
