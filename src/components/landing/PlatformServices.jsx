import React from "react";
import { Users, MapPinCheck, ListChecks, ShieldCheck, WalletCards, Boxes, FileSignature, BrainCircuit } from "lucide-react";

const modules = [
  { icon: Users, en: "Workforce & HR", ar: "الموارد البشرية", enText: "People, hierarchy, profiles and leave in one workspace.", arText: "إدارة الموظفين والهيكل والملفات والإجازات في مساحة موحدة." },
  { icon: MapPinCheck, en: "Smart Attendance", ar: "الحضور الذكي", enText: "Location-aware attendance, schedules and accurate records.", arText: "حضور مرتبط بالموقع وجداول وسجلات دقيقة." },
  { icon: ListChecks, en: "Tasks & Operations", ar: "المهام والعمليات", enText: "Plan, assign and follow operational work across stations.", arText: "تخطيط وإسناد ومتابعة الأعمال التشغيلية عبر المحطات." },
  { icon: ShieldCheck, en: "HSE & Compliance", ar: "السلامة والامتثال", enText: "Safety controls, permits, incidents and compliance insight.", arText: "ضوابط السلامة والتصاريح والحوادث ومؤشرات الامتثال." },
  { icon: WalletCards, en: "Payroll", ar: "الرواتب", enText: "Structured payroll management and professional reporting.", arText: "إدارة منظمة للرواتب وتقارير مالية احترافية." },
  { icon: Boxes, en: "Inventory", ar: "المخزون", enText: "Distributed stock, purchasing and movement traceability.", arText: "مخزون موزع ومشتريات وتتبع كامل للحركات." },
  { icon: FileSignature, en: "Files & Signing", ar: "الملفات والتوقيع", enText: "Secure documents, approvals and verifiable signatures.", arText: "مستندات آمنة واعتمادات وتوقيعات قابلة للتحقق." },
  { icon: BrainCircuit, en: "Niro Intelligence", ar: "ذكاء نيرو", enText: "Operational intelligence, analysis and decision support.", arText: "ذكاء تشغيلي وتحليلات ودعم متقدم للقرارات." },
];

export default function PlatformServices({ lang }) {
  const ar = lang === "ar";
  return <section dir={ar ? "rtl" : "ltr"} className="border-y border-border bg-secondary/55 px-4 py-16 sm:px-6 md:px-8 md:py-24">
    <div className="mx-auto grid max-w-[1380px] overflow-hidden rounded-2xl border border-border bg-card shadow-elevated lg:grid-cols-[0.82fr,1.8fr]">
      <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-landing-cinema p-8 text-white md:p-12">
        <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -end-8 -top-8 h-40 w-40 rounded-full border border-accent/40" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-landing-gold-light">{ar ? "منظومة PowerCare" : "PowerCare Ecosystem"}</p>
          <h2 className="mt-6 max-w-md font-heading text-4xl font-semibold leading-[1.08] tracking-[-0.04em] md:text-5xl">{ar ? "وحدات تعمل بتناغم واحد" : "One platform. Every operation."}</h2>
        </div>
        <p className="relative mt-16 max-w-sm border-s-2 border-accent ps-5 text-sm leading-7 text-white/65">{ar ? "أدوات مترابطة تمنح شركتك رؤية موحدة وتحكماً أدق في كل مستوى." : "Connected modules give your company unified visibility and precise control at every level."}</p>
      </div>
      <div className="grid sm:grid-cols-2">
        {modules.map(({ icon: Icon, en, ar: titleAr, enText, arText }, index) => <article key={en} className="group relative flex min-h-44 gap-5 border-b border-border p-6 transition-colors last:border-b-0 hover:bg-secondary/70 sm:p-7 sm:odd:border-e sm:[&:nth-last-child(-n+2)]:border-b-0">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-background text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>
          <div className="min-w-0"><span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">MODULE {String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-heading text-lg font-semibold text-foreground">{ar ? titleAr : en}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{ar ? arText : enText}</p></div>
        </article>)}
      </div>
    </div>
  </section>;
}