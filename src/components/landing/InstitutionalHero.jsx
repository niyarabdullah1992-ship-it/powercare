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
            {ar ? "منصة سعودية · تعمل بالعربية والإنجليزية" : "Built in Saudi Arabia · Arabic and English"}
          </motion.p>

          <motion.p
            custom={1}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-4 font-heading text-[13px] font-semibold tracking-[0.14em] text-white/70"
          >
            NIROVERA
          </motion.p>

          <motion.h1
            custom={2}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-3 font-heading text-[36px] font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-[48px] md:text-[56px]"
          >
            {ar
              ? "منصة تشغيل المحطات والقوى العاملة الميدانية"
              : "Run your stations and field workforce from one platform"}
          </motion.h1>

          <motion.p
            custom={3}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-5 max-w-[36rem] text-[17px] leading-[1.7] text-[#B9C3D8] md:text-[19px]"
          >
            {ar
              ? "العمليات والحضور والسلامة والرواتب في نظام واحد. تفتح المنصة على ما يحتاج قرارك اليوم، لا على جدول أرقام."
              : "Operations, attendance, safety and payroll in one system. It opens on what needs your decision today, not on a table of numbers."}
          </motion.p>

          <motion.div
            custom={4}
            variants={fade}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link
              to="/pricing"
              className="institutional-cta rounded-[10px] bg-[#0E7A4B] px-7 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#0B5F3A]"
            >
              {ar ? "ابدأ بمحطة واحدة" : "Start with one station"}
            </Link>
            <a
              href="#modules"
              className="rounded-[10px] border border-white/25 bg-white/5 px-7 py-3.5 text-[15px] text-white backdrop-blur-sm transition-colors hover:border-white/40 hover:bg-white/10"
            >
              {ar ? "استعرض الوحدات" : "See the modules"}
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
