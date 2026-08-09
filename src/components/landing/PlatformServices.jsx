import React from "react";
import { Users, MapPinCheck, ListChecks, ShieldCheck, WalletCards, Boxes, FileSignature, BrainCircuit, PackageCheck, ClipboardCheck, ReceiptText, LineChart } from "lucide-react";

const modules = [
  { icon: Users, en: "Workforce & HR", ar: "الموارد البشرية", enText: "People, hierarchy, profiles and leave in one workspace.", arText: "إدارة الموظفين والهيكل والملفات والإجازات في مساحة موحدة." },
  { icon: MapPinCheck, en: "Smart Attendance", ar: "الحضور الذكي", enText: "Location-aware attendance, schedules and accurate records.", arText: "حضور مرتبط بالموقع وجداول وسجلات دقيقة." },
  { icon: BrainCircuit, en: "Niro Intelligence", ar: "ذكاء نيرو", enText: "Operational intelligence, analysis and decision support.", arText: "ذكاء تشغيلي وتحليلات ودعم متقدم للقرارات." },
  { icon: ListChecks, en: "Tasks & Operations", ar: "المهام والعمليات", enText: "Plan, assign and follow operational work across stations.", arText: "تخطيط وإسناد ومتابعة الأعمال التشغيلية عبر المحطات." },
  { icon: ShieldCheck, en: "HSE & Compliance", ar: "السلامة والامتثال", enText: "Safety controls, permits, incidents and compliance insight.", arText: "ضوابط السلامة والتصاريح والحوادث ومؤشرات الامتثال." },
  { icon: WalletCards, en: "Payroll", ar: "الرواتب", enText: "Structured payroll management and professional reporting.", arText: "إدارة منظمة للرواتب وتقارير مالية احترافية." },
  { icon: Boxes, en: "Inventory", ar: "المخزون", enText: "Distributed stock, purchasing and movement traceability.", arText: "مخزون موزع ومشتريات وتتبع كامل للحركات." },
  { icon: FileSignature, en: "Files & Signing", ar: "الملفات والتوقيع", enText: "Secure documents, approvals and verifiable signatures.", arText: "مستندات آمنة واعتمادات وتوقيعات قابلة للتحقق." },
  { icon: PackageCheck, en: "Assets & Custody", ar: "الأصول والعهد", enText: "One holder per asset, every handover signed by both parties.", arText: "لكل أصل حائز واحد، وكل انتقال موثّق بتوقيع الطرفين." },
  { icon: ClipboardCheck, en: "Work Proof", ar: "إثبات العمل", enText: "Before and after evidence with a client-signed certificate.", arText: "توثيق قبل وبعد مع شهادة موقّعة من العميل." },
  { icon: ReceiptText, en: "Expenses", ar: "المصروفات", enText: "Station spending, receipts and approval trail.", arText: "مصروفات المحطات والفواتير ومسار الاعتماد." },
  { icon: LineChart, en: "Performance", ar: "الأداء", enText: "Fair scoring, evidence-backed points and clear reports.", arText: "تقييم عادل ونقاط مسندة بالأدلة وتقارير واضحة." },
];

export default function PlatformServices({ lang }) {
  const ar = lang === "ar";
  return <section dir={ar ? "rtl" : "ltr"} className="border-y border-border bg-secondary/55 py-16 md:py-24">
    <div className="w-full overflow-hidden border-y border-border bg-card shadow-elevated">
      <div className="relative grid overflow-hidden bg-landing-cinema p-6 text-white md:grid-cols-[1.15fr,0.85fr] md:items-end md:gap-7 md:p-7">
        <div className="absolute -end-20 -top-20 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -end-8 -top-8 h-40 w-40 rounded-full border border-accent/40" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-landing-gold-light">{ar ? "منظومة NiroVera" : "NiroVera Ecosystem"}</p>
          <h2 className="mt-3 max-w-xl font-heading text-3xl font-semibold leading-[1.08] tracking-[-0.04em]">{ar ? "وحدات تعمل بتناغم واحد" : "One platform. Every operation."}</h2>
        </div>
        <p className="relative mt-8 max-w-sm border-s-2 border-accent ps-5 text-sm leading-6 text-white/65 md:mt-0">{ar ? "أدوات مترابطة تمنح شركتك رؤية موحدة وتحكماً أدق في كل مستوى." : "Connected modules give your company unified visibility and precise control at every level."}</p>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {modules.map(({ icon: Icon, en, ar: titleAr, enText, arText }, index) => <article key={en} className="group relative min-h-[164px] border-b border-e border-border p-4 transition-colors hover:bg-secondary/70 last:border-e-0 sm:[&:nth-child(2n)]:border-e-0 md:min-h-[178px] md:[&:nth-child(2n)]:border-e md:[&:nth-child(3n)]:border-e-0 lg:[&:nth-child(3n)]:border-e lg:[&:nth-child(4n)]:border-e-0 lg:[&:nth-last-child(-n+4)]:border-b-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-background text-accent transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"><Icon className="h-4 w-4" strokeWidth={1.5} /></span>
          <div className="mt-3 min-w-0"><span className="font-mono text-[9px] tracking-[0.18em] text-muted-foreground">MODULE {String(index + 1).padStart(2, "0")}</span><h3 className="mt-2 font-heading text-lg font-semibold text-foreground">{ar ? titleAr : en}</h3><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{ar ? arText : enText}</p></div>
        </article>)}
      </div>
    </div>
  </section>;
}