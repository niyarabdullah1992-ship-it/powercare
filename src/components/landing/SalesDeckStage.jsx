import React from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";

function SlideShell({ children, tone = "light", className = "" }) {
  const tones = {
    navy: "bg-[#0B1A3F] text-white",
    light: "bg-[#F7F8FA] text-[#0B1A3F]",
    white: "bg-white text-[#0B1A3F]",
  };
  return (
    <div className={`relative flex h-full min-h-0 flex-col overflow-hidden ${tones[tone]} ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            tone === "navy"
              ? "radial-gradient(ellipse at 80% 10%, rgba(14,122,75,0.22), transparent 50%)"
              : "radial-gradient(ellipse at 0% 100%, rgba(14,122,75,0.06), transparent 45%)",
        }}
        aria-hidden
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col px-6 py-8 sm:px-10 sm:py-10 md:px-14 md:py-12 lg:px-16">
        {children}
      </div>
    </div>
  );
}

function SlideCover({ slide, ar }) {
  return (
    <SlideShell tone="navy">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <span className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">NiroVera</span>
      </div>
      <div className="mt-auto max-w-4xl">
        <h1 className="font-heading text-[clamp(2rem,5.5vw,4.75rem)] font-semibold leading-[1.12] tracking-[-0.03em]">
          {ar ? slide.titleAr : slide.titleEn}
        </h1>
        <p className="mt-6 max-w-3xl text-[clamp(1rem,2vw,1.65rem)] font-light leading-[1.55] text-[#A8B4C8]">
          {ar ? slide.subAr : slide.subEn}
        </p>
      </div>
      <div className="mt-10 flex items-center gap-3 text-sm text-[#64748B] sm:text-base">
        <span>{ar ? "عرض تعريفي" : "Sales briefing"}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#0E7A4B]" aria-hidden />
        <span>{ar ? "أغسطس 2026" : "August 2026"}</span>
      </div>
    </SlideShell>
  );
}

function SlideDivider({ slide, ar }) {
  return (
    <SlideShell tone="navy" className="justify-center">
      <span className="font-heading text-sm font-semibold tracking-[0.16em] text-[#3FBF80] sm:text-base" dir="ltr">
        {slide.chapter}
      </span>
      <h1 className="mt-5 font-heading text-[clamp(3rem,10vw,6.5rem)] font-semibold leading-none tracking-[-0.03em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
    </SlideShell>
  );
}

function SlideProblem({ slide, ar }) {
  return (
    <SlideShell tone="light">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <p className="mt-4 max-w-3xl text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.6] text-[#5A6B85]">
        {ar ? slide.subAr : slide.subEn}
      </p>
      <div className="mt-10 grid flex-1 gap-4 md:grid-cols-3 md:gap-5">
        {slide.stats.map((stat) => (
          <div key={stat.bodyEn} className="flex flex-col border border-[#E2E8F0] bg-white p-5 sm:p-6">
            <div
              className={`font-heading text-[clamp(2.75rem,6vw,4.5rem)] font-semibold leading-none ${
                stat.tone === "danger" ? "text-[#DC2626]" : "text-[#0B1A3F]"
              }`}
              dir="ltr"
            >
              {stat.value}
              {(ar ? stat.unitAr : stat.unitEn) ? (
                <span className="ms-2 text-[clamp(0.95rem,1.5vw,1.35rem)] font-normal text-[#5A6B85]">
                  {ar ? stat.unitAr : stat.unitEn}
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-[clamp(0.9rem,1.3vw,1.1rem)] leading-[1.55] text-[#0B1A3F]">
              {ar ? stat.bodyAr : stat.bodyEn}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideCost({ slide, ar }) {
  return (
    <SlideShell tone="white">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <div className="mt-10 grid flex-1 gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-8">
          {slide.items.map((item, i) => (
            <div
              key={item.titleEn}
              className={`border-t pt-6 ${i === 0 ? "border-[#0B1A3F] border-t-2" : "border-[#E2E8F0]"}`}
            >
              <h2 className="text-[clamp(1.1rem,1.8vw,1.35rem)] font-semibold">{ar ? item.titleAr : item.titleEn}</h2>
              <p className="mt-3 text-[clamp(0.95rem,1.4vw,1.15rem)] leading-[1.6] text-[#5A6B85]">
                {ar ? item.bodyAr : item.bodyEn}
              </p>
            </div>
          ))}
        </div>
        <aside className="bg-[#0B1A3F] p-7 text-white sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#3FBF80]">
            {ar ? "المحصلة" : "OUTCOME"}
          </p>
          <p className="mt-6 text-[clamp(1.15rem,2vw,1.55rem)] font-light leading-[1.55]">
            {ar ? slide.outcomeAr : slide.outcomeEn}
          </p>
        </aside>
      </div>
    </SlideShell>
  );
}

function SlideCommand({ slide, ar }) {
  return (
    <SlideShell tone="light">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <p className="mt-4 max-w-3xl text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.6] text-[#5A6B85]">
        {ar ? slide.subAr : slide.subEn}
      </p>
      <div className="mt-8 grid flex-1 gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-5">
        <div className="flex flex-col bg-[#0B1A3F] p-6 text-white sm:p-8">
          <p className="text-[11px] font-semibold tracking-[0.12em] text-[#6EE7B7]">
            {ar ? slide.scoreHintAr : slide.scoreHintEn}
          </p>
          <div className="mt-4 flex items-baseline gap-2" dir="ltr">
            <span className="font-heading text-[clamp(4rem,10vw,7rem)] font-semibold leading-none tracking-[-0.04em]">
              {slide.score}
            </span>
            <span className="text-2xl text-[#64748B]">/100</span>
          </div>
          <p className="mt-6 text-[clamp(0.9rem,1.3vw,1.05rem)] leading-[1.6] text-[#94A3B8]">
            {ar ? slide.scoreBodyAr : slide.scoreBodyEn}
          </p>
        </div>
        <div className="flex flex-col justify-center gap-0 border border-[#E2E8F0] bg-white px-5 py-2 sm:px-7">
          {slide.queue.map((item, i) => (
            <div
              key={item.titleEn}
              className={`flex flex-wrap items-center gap-3 py-5 ${i < slide.queue.length - 1 ? "border-b border-[#E2E8F0]" : ""}`}
            >
              <span
                className={`h-3 w-3 shrink-0 rounded-full ${
                  item.severity === "danger" ? "bg-[#DC2626]" : "bg-[#F59E0B]"
                }`}
                aria-hidden
              />
              <span className="min-w-0 flex-1 text-[clamp(0.95rem,1.5vw,1.2rem)] font-medium">
                {ar ? item.titleAr : item.titleEn}
              </span>
              <span className="text-[clamp(0.85rem,1.2vw,1rem)] text-[#5A6B85]">
                {ar ? item.metaAr : item.metaEn}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}

function SlideModules({ slide, ar }) {
  return (
    <SlideShell tone="white">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <p className="mt-4 max-w-3xl text-[clamp(0.95rem,1.6vw,1.2rem)] leading-[1.6] text-[#5A6B85]">
        {ar ? slide.subAr : slide.subEn}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-3">
        {slide.modules.map((mod) => (
          <div
            key={mod.en}
            className={`px-3 py-3.5 text-[clamp(0.78rem,1.1vw,0.98rem)] font-medium leading-snug sm:px-4 sm:py-4 ${
              mod.featured
                ? "border border-[#0B1A3F] bg-[#0B1A3F] text-white"
                : "border border-[#E2E8F0] bg-[#F7F8FA] text-[#0B1A3F]"
            }`}
          >
            {ar ? mod.ar : mod.en}
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideAssistant({ slide, ar }) {
  return (
    <SlideShell tone="light">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <div className="mt-8 flex flex-1 flex-col border border-[#E2E8F0] bg-white p-5 sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.1em] text-[#5A6B85]">
          {ar ? "السؤال" : "QUESTION"}
        </p>
        <p className="mt-3 text-[clamp(1.1rem,2.2vw,1.65rem)] font-medium leading-[1.45]">
          {ar ? slide.questionAr : slide.questionEn}
        </p>
        <div className="my-6 h-px bg-[#E2E8F0]" />
        <p className="max-w-4xl text-[clamp(0.95rem,1.5vw,1.25rem)] leading-[1.7] text-[#334155]">
          {ar ? slide.answerAr : slide.answerEn}
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {slide.metrics.map((m) => (
            <div key={m.labelEn} className="border border-[#E2E8F0] bg-[#F7F8FA] p-4 sm:p-5">
              <p className="text-[11px] tracking-[0.08em] text-[#5A6B85]">{ar ? m.labelAr : m.labelEn}</p>
              <p className="mt-2 font-heading text-[clamp(1.5rem,3vw,2rem)] font-semibold" dir="ltr">
                {m.value}
              </p>
            </div>
          ))}
          <div className="flex items-center justify-center bg-[#0E7A4B] px-4 py-5 text-center text-[clamp(0.95rem,1.4vw,1.15rem)] font-semibold text-white sm:col-span-2 lg:col-span-1">
            {ar ? slide.actionAr : slide.actionEn}
          </div>
        </div>
      </div>
    </SlideShell>
  );
}

function SlideSafety({ slide, ar }) {
  return (
    <SlideShell tone="white">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <div className="mt-10 grid gap-8 md:grid-cols-3">
        {slide.pillars.map((p) => (
          <div key={p.titleEn} className="border-t-2 border-[#0E7A4B] pt-6">
            <h2 className="text-[clamp(1.1rem,1.8vw,1.4rem)] font-semibold">{ar ? p.titleAr : p.titleEn}</h2>
            <p className="mt-4 text-[clamp(0.9rem,1.3vw,1.1rem)] leading-[1.65] text-[#5A6B85]">
              {ar ? p.bodyAr : p.bodyEn}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-5 bg-[#F7F8FA] p-5 sm:gap-8 sm:p-7">
        <span className="font-heading text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-none text-[#0E7A4B]" dir="ltr">
          {slide.streak}
        </span>
        <p className="text-[clamp(0.95rem,1.4vw,1.2rem)] leading-[1.5] text-[#0B1A3F]">
          {ar ? slide.streakAr : slide.streakEn}
        </p>
      </div>
    </SlideShell>
  );
}

function SlideCompare({ slide, ar }) {
  return (
    <SlideShell tone="light">
      <h1 className="font-heading text-[clamp(1.5rem,3.5vw,2.5rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <div className="mt-8 overflow-hidden border border-[#E2E8F0] bg-white">
        <div className="grid grid-cols-3 bg-[#0B1A3F] text-white">
          <div className="px-3 py-3 text-[clamp(0.75rem,1.1vw,0.95rem)] font-semibold sm:px-5 sm:py-4">
            {ar ? "المعيار" : "Criterion"}
          </div>
          <div className="px-3 py-3 text-[clamp(0.75rem,1.1vw,0.95rem)] font-semibold text-[#94A3B8] sm:px-5 sm:py-4">
            {ar ? "نظام تقليدي" : "Traditional"}
          </div>
          <div className="px-3 py-3 text-[clamp(0.75rem,1.1vw,0.95rem)] font-semibold text-[#6EE7B7] sm:px-5 sm:py-4">
            NiroVera
          </div>
        </div>
        {slide.rows.map((row, i) => (
          <div
            key={row.criterionEn}
            className={`grid grid-cols-3 ${i < slide.rows.length - 1 ? "border-b border-[#E2E8F0]" : ""}`}
          >
            <div className="px-3 py-3.5 text-[clamp(0.75rem,1.1vw,0.95rem)] font-medium sm:px-5 sm:py-4">
              {ar ? row.criterionAr : row.criterionEn}
            </div>
            <div className="px-3 py-3.5 text-[clamp(0.75rem,1.1vw,0.95rem)] text-[#5A6B85] sm:px-5 sm:py-4">
              {ar ? row.otherAr : row.otherEn}
            </div>
            <div className="px-3 py-3.5 text-[clamp(0.75rem,1.1vw,0.95rem)] font-medium text-[#0B1A3F] sm:px-5 sm:py-4">
              {ar ? row.oursAr : row.oursEn}
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideRoi({ slide, ar }) {
  return (
    <SlideShell tone="navy">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <p className="mt-4 max-w-3xl text-[clamp(0.95rem,1.5vw,1.15rem)] leading-[1.6] text-[#94A3B8]">
        {ar ? slide.subAr : slide.subEn}
      </p>
      <div className="mt-auto grid gap-8 pt-10 md:grid-cols-3 md:gap-10">
        {slide.figures.map((fig) => (
          <div key={fig.value}>
            <p
              className="font-heading text-[clamp(2.75rem,7vw,5rem)] font-semibold leading-none tracking-[-0.04em] text-[#6EE7B7]"
              dir="ltr"
            >
              {fig.value}
            </p>
            <p className="mt-5 text-[clamp(0.95rem,1.4vw,1.15rem)] leading-[1.55] text-[#E2E8F0]">
              {ar ? fig.bodyAr : fig.bodyEn}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}

function SlideRollout({ slide, ar }) {
  return (
    <SlideShell tone="white">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <div className="mt-10 grid flex-1 gap-0 md:grid-cols-3">
        {slide.weeks.map((week, i) => (
          <div
            key={week.weekEn}
            className={`py-2 md:px-6 ${i === 0 ? "md:ps-0" : ""} ${i === slide.weeks.length - 1 ? "md:pe-0" : ""} ${
              i > 0 ? "border-t border-[#E2E8F0] pt-6 md:border-t-0 md:border-s md:pt-2" : ""
            }`}
          >
            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#0E7A4B]" dir="ltr">
              {ar ? week.weekAr : week.weekEn}
            </p>
            <h2 className="mt-3 text-[clamp(1.2rem,2vw,1.55rem)] font-semibold">
              {ar ? week.titleAr : week.titleEn}
            </h2>
            <p className="mt-3 text-[clamp(0.9rem,1.3vw,1.1rem)] leading-[1.65] text-[#5A6B85]">
              {ar ? week.bodyAr : week.bodyEn}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-8 bg-[#F7F8FA] px-5 py-5 text-[clamp(0.95rem,1.4vw,1.15rem)] leading-[1.55] text-[#0B1A3F] sm:px-7">
        {ar ? slide.footnoteAr : slide.footnoteEn}
      </p>
    </SlideShell>
  );
}

function SlidePlans({ slide, ar }) {
  return (
    <SlideShell tone="light">
      <h1 className="font-heading text-[clamp(1.75rem,4vw,2.75rem)] font-semibold tracking-[-0.02em]">
        {ar ? slide.titleAr : slide.titleEn}
      </h1>
      <p className="mt-3 max-w-2xl text-[clamp(0.9rem,1.4vw,1.1rem)] text-[#5A6B85]">
        {ar ? slide.subAr : slide.subEn}
      </p>
      <div className="mt-8 grid flex-1 gap-4 md:grid-cols-3">
        {slide.plans.map((plan) => (
          <div
            key={plan.nameEn}
            className={`flex flex-col p-6 sm:p-7 ${
              plan.featured
                ? "border border-[#0B1A3F] bg-[#0B1A3F] text-white"
                : "border border-[#E2E8F0] bg-white text-[#0B1A3F]"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[clamp(1.2rem,2vw,1.45rem)] font-semibold">
                {ar ? plan.nameAr : plan.nameEn}
              </h2>
              {plan.featured && (
                <span className="rounded-full bg-[#0E7A4B] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                  {ar ? plan.badgeAr : plan.badgeEn}
                </span>
              )}
            </div>
            <p className={`mt-4 font-heading text-[clamp(1.4rem,2.5vw,1.9rem)] font-semibold ${plan.featured ? "text-white" : "text-[#0B1A3F]"}`}>
              {ar ? plan.priceAr : plan.priceEn}
            </p>
            <p className={`mt-4 text-[clamp(0.9rem,1.3vw,1.05rem)] leading-[1.65] ${plan.featured ? "text-[#CBD5E1]" : "text-[#5A6B85]"}`}>
              {ar ? plan.bodyAr : plan.bodyEn}
            </p>
          </div>
        ))}
      </div>
      <Link
        to="/pricing"
        className="mt-6 inline-flex text-[13px] font-medium text-[#0E7A4B] hover:underline"
      >
        {ar ? "افتح التسعير الحي ←" : "Open live pricing →"}
      </Link>
    </SlideShell>
  );
}

function SlideClose({ slide, ar }) {
  return (
    <SlideShell tone="navy">
      <div className="flex items-center gap-3">
        <Logo size={32} />
        <span className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">NiroVera</span>
      </div>
      <div className="mt-auto max-w-4xl">
        <h1 className="font-heading text-[clamp(1.85rem,5vw,3.75rem)] font-semibold leading-[1.15] tracking-[-0.03em]">
          {ar ? slide.titleAr : slide.titleEn}
        </h1>
        <p className="mt-6 max-w-3xl text-[clamp(1rem,1.8vw,1.4rem)] leading-[1.55] text-[#94A3B8]">
          {ar ? slide.subAr : slide.subEn}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/"
            className="institutional-cta rounded-[10px] bg-[#0E7A4B] px-6 py-3 text-[14px] font-medium text-white hover:bg-[#0B5F3A]"
          >
            {ar ? "اطلب العرض التجريبي" : "Request the pilot"}
          </Link>
          <a
            href={`mailto:${slide.email}?subject=${encodeURIComponent(ar ? "طلب تجربة محطة — نيروفيرا" : "NiroVera station pilot request")}`}
            className="rounded-[10px] border border-white/25 bg-white/5 px-6 py-3 text-[14px] text-white hover:bg-white/10"
          >
            {ar ? "راسلنا" : "Email us"}
          </a>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-[clamp(0.85rem,1.2vw,1.05rem)] text-[#CBD5E1]">
        <span>{ar ? slide.contactNameAr : slide.contactNameEn}</span>
        <a href={`mailto:${slide.email}`} className="hover:text-white" dir="ltr">
          {slide.email}
        </a>
        <a href="tel:+966595414472" className="hover:text-white" dir="ltr">
          {slide.phone}
        </a>
      </div>
    </SlideShell>
  );
}

const RENDERERS = {
  cover: SlideCover,
  divider: SlideDivider,
  problem: SlideProblem,
  cost: SlideCost,
  command: SlideCommand,
  modules: SlideModules,
  assistant: SlideAssistant,
  safety: SlideSafety,
  compare: SlideCompare,
  roi: SlideRoi,
  rollout: SlideRollout,
  plans: SlidePlans,
  close: SlideClose,
};

export default function SalesDeckStage({ slides, index, ar }) {
  const slide = slides[index];
  const Renderer = RENDERERS[slide.kind] || SlideCover;

  return (
    <div className="sales-deck-stage relative h-full w-full overflow-hidden rounded-none bg-[#08142F] shadow-none md:rounded-[14px] md:shadow-[0_24px_60px_rgba(8,20,47,0.45)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          className="h-full w-full"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Renderer slide={slide} ar={ar} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
