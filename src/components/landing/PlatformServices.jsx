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
  return <section dir={ar ? "rtl" : "ltr"} className="border-t border-border bg-landing-bg px-4 py-14 sm:px-6 md:px-8 md:py-16">
    <div className="mx-auto max-w-[1380px]">
      <div className="mb-9 max-w-2xl">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{ar ? "منظومة PowerCare" : "PowerCare Ecosystem"}</p>
        <h2 className="font-heading text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">{ar ? "وحدات تعمل بتناغم واحد" : "One platform. Every operation."}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{ar ? "أدوات مترابطة تمنح شركتك رؤية موحدة وتحكماً أدق في كل مستوى." : "Connected modules give your company unified visibility and precise control at every level."}</p>
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {modules.map(({ icon: Icon, en, ar: titleAr, enText, arText }, index) => <article key={en} className="group min-h-56 bg-card p-6 transition-colors hover:bg-secondary">
          <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-secondary text-accent"><Icon className="h-5 w-5" strokeWidth={1.5} /></span><span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, "0")}</span></div>
          <h3 className="mt-8 font-heading text-xl font-medium text-foreground">{ar ? titleAr : en}</h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{ar ? arText : enText}</p>
        </article>)}
      </div>
    </div>
  </section>;
}