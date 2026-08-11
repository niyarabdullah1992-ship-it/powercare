import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, Globe, ChevronDown, Check, Facebook, Twitter, X as XIcon, Send, Phone, Mail } from "lucide-react";
import Logo from "@/components/Logo";
import ProofCycleLanding from "@/components/landing/ProofCycleLanding";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import { trackVisit } from "@/lib/trackVisit";

const NAV = [
  { href: "#proof-cycle", ar: "دورة الإثبات", en: "Proof cycle" },
  { href: "#sectors", ar: "القطاعات", en: "Sectors" },
  { href: "#how", ar: "كيف تعمل", en: "How it works" },
  { href: "#compare", ar: "المقارنة", en: "Compare" },
  { href: "#trust", ar: "الأمان", en: "Trust" },
  { href: "#pricing", ar: "الباقات", en: "Pricing" },
];

const SECTORS = [
  {
    arTitle: "الشركات",
    enTitle: "Companies",
    arText: "فرق ميدانية موزعة، محطات متعددة، ومسير رواتب مرتبط بالحضور والإثبات.",
    enText: "Distributed field teams, multi-site ops, payroll tied to attendance and proof.",
    pointsAr: ["حضور بموقع", "مهام بوزن جهد", "ختم للعميل"],
    pointsEn: ["Location attendance", "Weighted tasks", "Client seal"],
  },
  {
    arTitle: "الجهات الحكومية",
    enTitle: "Government",
    arText: "صلاحيات صارمة، مسارات اعتماد مكتوبة، وتقارير جاهزة للرقابة.",
    enText: "Strict roles, written approvals, and audit-ready reports.",
    pointsAr: ["فصل أدوار", "رفض بسبب مكتوب", "تصدير امتثال"],
    pointsEn: ["Role separation", "Written rejection", "Compliance export"],
  },
  {
    arTitle: "الهيئات والمؤسسات",
    enTitle: "Authorities & institutions",
    arText: "نفس نواة دورة الإثبات مع ضبط التقارير والهيكل حسب طبيعة الجهة.",
    enText: "Same proof-cycle core, tuned structure and reporting per institution.",
    pointsAr: ["هيكل مرن", "حوكمة وثائق", "دعم عربي"],
    pointsEn: ["Flexible structure", "Document governance", "Arabic support"],
  },
];

const ROLES = [
  { badge: "م", arTitle: "الموظف", enTitle: "Employee", arText: "مهامه، حضوره، راتبه، ومستنداته فقط.", enText: "Only their tasks, attendance, pay and documents." },
  { badge: "د", arTitle: "المدير المباشر", enTitle: "Line manager", arText: "يراجع إثباتات الفريق ويعتمد أو يرفض بسبب.", enText: "Reviews team proof and approves or rejects in writing." },
  { badge: "ب", arTitle: "الموارد البشرية", enTitle: "HR", arText: "تدير المنظومة والمسير والهيكل والطلبات.", enText: "Runs the system, payroll, structure and requests." },
  { badge: "ت", arTitle: "التنفيذي", enTitle: "Executive", arText: "يقرأ المؤشرات دون ضوضاء تشغيلية.", enText: "Reads indicators without operational noise." },
];

const COMPARE_ROWS = [
  { ar: "إثبات أن العمل أُنجز", en: "Proof work was done", nv: true, other: false },
  { ar: "حضور مربوط بالمهمة الميدانية", en: "Attendance gated to field tasks", nv: true, other: false },
  { ar: "وزن جهد بدل ساعات الجلوس", en: "Effort weight vs desk hours", nv: true, other: false },
  { ar: "ختم عميل قابل للتحقق (SHA-256)", en: "Verifiable client seal (SHA-256)", nv: true, other: false },
  { ar: "عربية أولًا + 9 لغات", en: "Arabic-first + 9 languages", nv: true, other: false },
  { ar: "مبنية للامتثال السعودي", en: "Built for Saudi compliance", nv: true, other: false },
];

const TRUST = [
  { arTitle: "WPS والمسير", enTitle: "WPS & payroll", arText: "الحضور يغذي المسير بسلسلة قابلة للتدقيق.", enText: "Attendance feeds payroll through an auditable chain." },
  { arTitle: "ملكية فكرية مسجّلة", enTitle: "Registered IP", arText: "دورة الإثبات ومنهجية وزن الجهد محمية.", enText: "Proof cycle and effort weighting are protected IP." },
  { arTitle: "صلاحيات دقيقة", enTitle: "Precise permissions", arText: "كل دور يرى مساحته فقط — بلا شاشات زائدة.", enText: "Each role sees only its space — no extra screens." },
  { arTitle: "تحقق عام للإثبات", enTitle: "Public proof verify", arText: "العميل يتحقق من الختم دون دخول للمنصة.", enText: "Clients verify the seal without logging in." },
];

const PLANS = [
  {
    tagAr: "للشركات الصغيرة",
    tagEn: "For small companies",
    nameAr: "أعمال",
    nameEn: "Business",
    price: "حسب الحجم",
    priceEn: "Sized to you",
    featuresAr: ["دورة الإثبات كاملة", "الحضور والرواتب", "حتى 3 مقرات", "دعم بالعربية"],
    featuresEn: ["Full proof cycle", "Attendance & payroll", "Up to 3 sites", "Arabic support"],
    featured: false,
  },
  {
    tagAr: "الأكثر اختيارًا",
    tagEn: "Most chosen",
    nameAr: "مؤسسات",
    nameEn: "Enterprise",
    price: "مخصص",
    priceEn: "Custom",
    featuresAr: ["محطات متعددة", "حوكمة وتوقيع", "إثبات عميل", "مرافقة تهيئة"],
    featuresEn: ["Multi-station", "Governance & signing", "Client proof", "Onboarding support"],
    featured: true,
  },
  {
    tagAr: "للقطاع العام",
    tagEn: "Public sector",
    nameAr: "حكومي",
    nameEn: "Government",
    price: "بعرض رسمي",
    priceEn: "Formal quote",
    featuresAr: ["مسارات اعتماد صارمة", "تقارير رقابية", "صلاحيات مفصّلة", "اتفاقية مستوى خدمة"],
    featuresEn: ["Strict approval paths", "Oversight reports", "Fine-grained roles", "SLA"],
    featured: false,
  },
];

export default function Landing() {
  const { t, lang, setLang, languages } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const [demoSent, setDemoSent] = useState(false);
  const currentLang = languages.find((l) => l.code === lang);
  const ar = lang === "ar";

  useEffect(() => {
    trackVisit("/");
  }, []);

  useEffect(() => {
    const close = () => setLangOpen(false);
    if (langOpen) {
      document.addEventListener("click", close);
      return () => document.removeEventListener("click", close);
    }
  }, [langOpen]);

  return (
    <div className="powercare-public min-h-screen bg-[#F7F8FA] font-body text-[#101828]" dir={ar ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-50 border-b border-[#E4E7EC] bg-[#F7F8FA]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-6 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <Logo size={24} />
            <span className="font-heading text-base font-semibold">NiroVera</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-5 lg:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-[12.8px] text-[#5A6478] hover:text-[#0E7A4B]">
                {ar ? item.ar : item.en}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLangOpen((v) => !v); }}
                className="flex items-center gap-1.5 rounded-md border border-[#E4E7EC] bg-white px-2.5 py-2 text-xs text-[#475467] hover:bg-[#F2F4F7]"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{currentLang?.flag}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute end-0 z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-[#E4E7EC] bg-white py-1 shadow-xl">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm ${lang === l.code ? "bg-[#E8F3ED] text-[#0E7A4B]" : "text-[#101828] hover:bg-[#F7F8FA]"}`}
                    >
                      <span>{l.flag} {l.label}</span>
                      {lang === l.code && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/login" className="hidden rounded-lg border border-[#E4E7EC] bg-white px-3.5 py-2 text-[13px] text-[#344054] hover:bg-[#F2F4F7] sm:inline">
              {ar ? "دخول المنصة" : "Enter platform"}
            </Link>
            <a href="#demo" className="rounded-lg bg-[#0E7A4B] px-3.5 py-2 text-[13px] text-white hover:bg-[#0B5F3A]">
              {ar ? "اطلب عرضًا" : "Request demo"}
            </a>
          </div>
        </div>
      </header>

      {/* Hero — Website handoff: centered value prop, no login card */}
      <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-[22px] px-6 pb-16 pt-[72px] text-center md:px-8 md:pb-[72px] md:pt-[88px]">
        <span className="rounded-full border border-[#C9D6CE] bg-[#F1F7F3] px-3.5 py-1.5 text-[12.5px] text-[#0E7A4B]">
          {ar ? "منصة سعودية · مسجّلة الملكية الفكرية · عربية أولًا بـ 9 لغات" : "Saudi platform · Registered IP · Arabic-first with 9 languages"}
        </span>
        <h1 className="m-0 max-w-[840px] text-[34px] font-bold leading-[1.35] text-[#0B1A3F] md:text-[52px]">
          {ar
            ? "إدارة موارد بشرية لا تكتفي بالتسجيل، بل تُثبت أن العمل أُنجز فعلًا"
            : "HR that doesn’t just log work — it proves the work was done"}
        </h1>
        <p className="m-0 max-w-[680px] text-[16px] leading-[1.9] text-[#5A6478] md:text-[17px]">
          {ar
            ? "نيروفيرا تربط الحضور بالمهمة، والمهمة بالإثبات، والإثبات بالنقاط والأداء — فيصبح كل قرار إداري موثّقًا ببصمة رقمية يمكن لأي جهة رقابية التحقق منها."
            : "NiroVera links attendance to tasks, tasks to proof, and proof to performance — so every management decision carries a verifiable digital seal."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#demo" className="rounded-[10px] bg-[#0B1A3F] px-7 py-3.5 text-[15px] text-white hover:bg-[#14233C]">
            {ar ? "اطلب عرضًا توضيحيًا" : "Request a walkthrough"}
          </a>
          <Link to="/login" className="rounded-[10px] border border-[#E4E7EC] bg-white px-7 py-3.5 text-[15px] text-[#344054] hover:bg-[#F2F4F7]">
            {ar ? "دخول المنصة" : "Enter platform"}
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-9">
          {[
            { v: "23", ar: "وحدة متكاملة", en: "Integrated modules" },
            { v: "4", ar: "حلقات إثبات", en: "Proof links" },
            { v: "9", ar: "لغات", en: "Languages" },
            { v: "1", ar: "سلسلة لا تنقطع", en: "Unbroken chain" },
          ].map((s) => (
            <div key={s.en} className="flex flex-col items-center gap-1">
              <span className="font-heading text-[30px] font-semibold text-[#0B1A3F]">{s.v}</span>
              <span className="text-[12.5px] text-[#98A2B3]">{ar ? s.ar : s.en}</span>
            </div>
          ))}
        </div>
      </section>

      <ProofCycleLanding lang={lang} />

      <section id="sectors" className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-16 md:px-8 md:py-[72px]">
        <div className="max-w-[720px]">
          <h2 className="m-0 text-[28px] font-bold text-[#0B1A3F] md:text-[32px]">
            {ar ? "مصمّمة للشركات والجهات الحكومية والهيئات" : "Built for companies, government and institutions"}
          </h2>
          <p className="mt-2 text-[15px] leading-[1.9] text-[#5A6478]">
            {ar
              ? "نفس النواة، وضبط مختلف لكل قطاع — الصلاحيات ومسارات الاعتماد والتقارير تُهيّأ حسب طبيعة الجهة."
              : "Same core, tuned per sector — permissions, approvals and reports match the organization."}
          </p>
        </div>
        <div className="grid gap-[18px] md:grid-cols-3">
          {SECTORS.map((s) => (
            <article key={s.enTitle} className="flex flex-col gap-3.5 rounded-[14px] border border-[#E4E7EC] bg-white p-[26px]">
              <h3 className="text-[17px] font-semibold text-[#0B1A3F]">{ar ? s.arTitle : s.enTitle}</h3>
              <p className="text-[13.5px] leading-[1.9] text-[#5A6478]">{ar ? s.arText : s.enText}</p>
              <ul className="mt-1 flex flex-col gap-2">
                {(ar ? s.pointsAr : s.pointsEn).map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[12.8px] leading-[1.8] text-[#475467]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E7A4B]" />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="border-y border-[#E4E7EC] bg-white">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-12 md:px-8 md:py-[72px]">
          <div className="flex flex-col gap-3.5">
            <h2 className="m-0 text-[28px] font-bold text-[#0B1A3F] md:text-[32px]">
              {ar ? "كل دور يرى مساحته فقط" : "Every role sees only its space"}
            </h2>
            <p className="m-0 text-[15px] leading-[2] text-[#5A6478]">
              {ar
                ? "الموظف يرى مهامه وحضوره وراتبه. المدير المباشر يرى فريقه ويراجع الإثباتات. الموارد البشرية تدير المنظومة، والتنفيذي يقرأ المؤشرات."
                : "Employees see tasks, attendance and pay. Managers review team proof. HR runs the system. Executives read indicators."}
            </p>
            <div className="flex flex-col gap-2.5">
              {ROLES.map((r) => (
                <div key={r.enTitle} className="flex items-center gap-3 rounded-[10px] border border-[#EEF0F4] bg-[#F7F8FA] px-4 py-3">
                  <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[#0B1A3F] text-xs text-white">{r.badge}</span>
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[#101828]">{ar ? r.arTitle : r.enTitle}</p>
                    <p className="text-xs text-[#667085]">{ar ? r.arText : r.enText}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/login" className="mt-1.5 self-start rounded-[9px] bg-[#0E7A4B] px-[22px] py-[11px] text-[13.5px] text-white hover:bg-[#0B5F3A]">
              {ar ? "دخول لتجربة دورك" : "Sign in to try your role"}
            </Link>
          </div>
          <div className="overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-[#F7F8FA] shadow-[0_24px_60px_rgba(11,26,63,.12)]">
            <div className="flex items-center gap-2 bg-[#0B1A3F] px-3.5 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#1B2C55]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#1B2C55]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#0E7A4B]" />
              <span className="ms-auto font-heading text-[11px] text-[#8C9AB8]">app.nirovera</span>
            </div>
            <div className="space-y-3 p-5">
              <p className="text-[12.5px] text-[#667085]">{ar ? "فحص وصيانة مضخات الخط الثالث" : "Line-3 pump inspection"}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#FFF6E5] px-2.5 py-1 text-[11.5px] text-[#B54708]">{ar ? "بانتظار المراجعة" : "Awaiting review"}</span>
                <span className="rounded-full bg-[#E8F3ED] px-2.5 py-1 text-[11.5px] text-[#0E7A4B]">{ar ? "وزن الجهد ×4" : "Effort ×4"}</span>
                <span className="rounded-full border border-[#E4E7EC] bg-white px-2.5 py-1 text-[11.5px] text-[#475467]">{ar ? "ميداني — يتطلب حضورًا" : "Field — attendance required"}</span>
              </div>
              <p className="rounded-[10px] border border-[#E4E7EC] bg-white p-3 text-[12.5px] leading-relaxed text-[#475467]">
                {ar
                  ? "إقرار الموظف: أقر بأن الفحص تم ميدانيًا وأن القراءات المرفقة صحيحة."
                  : "Employee attestation: I confirm the inspection was done on site with correct readings attached."}
              </p>
              <div className="flex gap-2">
                <span className="rounded-lg bg-[#0E7A4B] px-3 py-1.5 text-xs text-white">{ar ? "اعتماد ومنح النقاط" : "Approve & award points"}</span>
                <span className="rounded-lg border border-[#E4E7EC] bg-white px-3 py-1.5 text-xs text-[#475467]">{ar ? "رفض بسبب مكتوب" : "Reject with reason"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="compare" className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
        <h2 className="m-0 mb-8 text-[28px] font-bold text-[#0B1A3F] md:text-[32px]">
          {ar ? "لماذا نيروفيرا وليس الأنظمة العالمية؟" : "Why NiroVera vs global systems?"}
        </h2>
        <div className="overflow-hidden rounded-[14px] border border-[#E4E7EC] bg-white">
          <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-[#EEF0F4] bg-[#F9FAFB] px-4 py-3 text-xs text-[#667085]">
            <span>{ar ? "وجه المقارنة" : "Comparison"}</span>
            <span className="font-semibold text-[#0E7A4B]">{ar ? "نيروفيرا" : "NiroVera"}</span>
            <span>{ar ? "الأنظمة العالمية" : "Global systems"}</span>
          </div>
          {COMPARE_ROWS.map((row) => (
            <div key={row.en} className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-[#F2F4F7] px-4 py-3.5 text-[13px] text-[#344054] last:border-b-0">
              <span>{ar ? row.ar : row.en}</span>
              <span className="text-[#0E7A4B]">{row.nv ? (ar ? "نعم" : "Yes") : "—"}</span>
              <span className="text-[#98A2B3]">{row.other ? (ar ? "نعم" : "Yes") : (ar ? "ضعيف / غير أصلي" : "Weak / bolted on")}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="trust" className="mx-auto flex max-w-[1200px] flex-col gap-7 px-6 py-16 md:px-8 md:py-[72px]">
        <h2 className="m-0 text-[28px] font-bold text-[#0B1A3F] md:text-[32px]">
          {ar ? "مبنية للامتثال السعودي" : "Built for Saudi compliance"}
        </h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <article key={item.enTitle} className="flex flex-col gap-2 rounded-xl border border-[#E4E7EC] bg-white p-[22px]">
              <h3 className="text-[14.5px] font-semibold text-[#0B1A3F]">{ar ? item.arTitle : item.enTitle}</h3>
              <p className="text-[12.8px] leading-[1.8] text-[#5A6478]">{ar ? item.arText : item.enText}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="pricing" className="border-y border-[#E4E7EC] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 py-16 md:px-8 md:py-[72px]">
          <div className="text-center">
            <h2 className="m-0 text-[28px] font-bold text-[#0B1A3F] md:text-[32px]">
              {ar ? "باقات بحسب حجم الجهة" : "Plans by organization size"}
            </h2>
            <p className="mt-2 text-[14.5px] text-[#5A6478]">
              {ar ? "كل الباقات تشمل دورة الإثبات كاملة والدعم بالعربية." : "Every plan includes the full proof cycle and Arabic support."}
            </p>
          </div>
          <div className="grid items-stretch gap-[18px] md:grid-cols-3">
            {PLANS.map((p) => (
              <article
                key={p.nameEn}
                className={`flex flex-col gap-3 rounded-[14px] border p-6 ${
                  p.featured ? "border-[#0E7A4B] bg-[#0B1A3F] text-white" : "border-[#E4E7EC] bg-[#F7F8FA] text-[#101828]"
                }`}
              >
                <span className={`text-[13px] ${p.featured ? "text-[#8C9AB8]" : "text-[#667085]"}`}>{ar ? p.tagAr : p.tagEn}</span>
                <span className="text-xl font-bold">{ar ? p.nameAr : p.nameEn}</span>
                <span className={`font-heading text-[28px] font-bold ${p.featured ? "text-white" : "text-[#0B1A3F]"}`}>
                  {ar ? p.price : p.priceEn}
                </span>
                <ul className="mt-2 flex flex-1 flex-col gap-2.5">
                  {(ar ? p.featuresAr : p.featuresEn).map((f) => (
                    <li key={f} className={`flex items-start gap-2.5 text-[12.8px] leading-[1.7] ${p.featured ? "text-[#C7D2E6]" : "text-[#475467]"}`}>
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3FBF80]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#demo"
                  className={`mt-2 rounded-lg px-4 py-2.5 text-center text-[13px] ${
                    p.featured ? "bg-[#0E7A4B] text-white hover:bg-[#0B5F3A]" : "bg-[#0B1A3F] text-white hover:bg-[#14233C]"
                  }`}
                >
                  {ar ? "اطلب عرضًا" : "Request demo"}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="demo" className="bg-[#0B1A3F]">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-[72px]">
          <div>
            <h2 className="m-0 text-[28px] font-bold text-white md:text-[32px]">
              {ar ? "اطلب عرضًا توضيحيًا" : "Request a walkthrough"}
            </h2>
            <p className="mt-3 max-w-md text-[15px] leading-[1.9] text-[#B9C3D8]">
              {ar
                ? "نريكم دورة الإثبات على بيانات جهتكم — من بصمة الحضور إلى ختم العميل."
                : "We’ll show the proof cycle on your context — from attendance to client seal."}
            </p>
            <ul className="mt-6 space-y-2 text-[13px] text-[#8C9AB8]">
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#3FBF80]" /><a href="tel:+966595414472" dir="ltr" className="hover:text-white">0595414472</a></li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#3FBF80]" /><a href="mailto:niyar@powercares.pro" className="hover:text-white">niyar@powercares.pro</a></li>
            </ul>
          </div>
          {demoSent ? (
            <div className="flex items-center rounded-[14px] border border-[#1B2C55] bg-[#0D1D42] p-8 text-[15px] leading-relaxed text-[#C7D2E6]">
              {ar ? "شكرًا — سنعود إليكم قريبًا لترتيب العرض." : "Thank you — we’ll follow up shortly to schedule the walkthrough."}
            </div>
          ) : (
            <form
              className="flex flex-col gap-3 rounded-[14px] border border-[#1B2C55] bg-[#0D1D42] p-6"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const subject = encodeURIComponent(ar ? "طلب عرض نيروفيرا" : "NiroVera demo request");
                const body = encodeURIComponent(
                  `${ar ? "الاسم" : "Name"}: ${fd.get("name")}\n${ar ? "الجهة" : "Org"}: ${fd.get("org")}\n${ar ? "الجوال" : "Phone"}: ${fd.get("phone")}\n${ar ? "البريد" : "Email"}: ${fd.get("email")}\n\n${fd.get("note") || ""}`,
                );
                window.location.href = `mailto:niyar@powercares.pro?subject=${subject}&body=${body}`;
                setDemoSent(true);
              }}
            >
              <input name="name" required placeholder={ar ? "الاسم" : "Name"} className="rounded-lg border border-[#1E3162] bg-[#0B1A3F] px-3 py-2.5 text-sm text-white placeholder:text-[#5C6E96]" />
              <input name="org" required placeholder={ar ? "الجهة / الشركة" : "Organization"} className="rounded-lg border border-[#1E3162] bg-[#0B1A3F] px-3 py-2.5 text-sm text-white placeholder:text-[#5C6E96]" />
              <input name="phone" required placeholder={ar ? "الجوال" : "Phone"} className="rounded-lg border border-[#1E3162] bg-[#0B1A3F] px-3 py-2.5 text-sm text-white placeholder:text-[#5C6E96]" />
              <input name="email" type="email" required placeholder={ar ? "البريد" : "Email"} className="rounded-lg border border-[#1E3162] bg-[#0B1A3F] px-3 py-2.5 text-sm text-white placeholder:text-[#5C6E96]" />
              <textarea name="note" rows={3} placeholder={ar ? "ملاحظات (اختياري)" : "Notes (optional)"} className="rounded-lg border border-[#1E3162] bg-[#0B1A3F] px-3 py-2.5 text-sm text-white placeholder:text-[#5C6E96]" />
              <button type="submit" className="mt-1 rounded-lg bg-[#0E7A4B] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0B5F3A]">
                {ar ? "إرسال الطلب" : "Send request"}
              </button>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#08142F] px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-2xl text-white">NiroVera</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {ar
                ? "من الحضور إلى ختم العميل — سلسلة إثبات واحدة لا تنقطع."
                : "From attendance to client seal — one unbroken proof chain."}
            </p>
            <div className="mt-5 flex items-center gap-4 text-white/45"><Facebook className="h-4 w-4" /><Twitter className="h-4 w-4" /><XIcon className="h-4 w-4" /><Send className="h-4 w-4" /></div>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{ar ? "روابط" : "Links"}</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li><Link to="/about" className="hover:text-[#3FBF80]">{t("footerAbout")}</Link></li>
              <li><Link to="/security" className="hover:text-[#3FBF80]">{ar ? "الأمان والامتثال" : "Security & Compliance"}</Link></li>
              <li><Link to="/terms" className="hover:text-[#3FBF80]">{t("footerTerms")}</Link></li>
              <li><Link to="/privacy" className="hover:text-[#3FBF80]">{ar ? "الخصوصية" : "Privacy"}</Link></li>
              <li><Link to="/login" className="hover:text-[#3FBF80]">{ar ? "دخول المنصة" : "Enter platform"}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{t("footerContactHeading")}</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-white/55">
              <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#3FBF80]" />{ar ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"}</li>
              <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-[#3FBF80]" /><a href="tel:+966595414472" dir="ltr" className="hover:text-[#3FBF80]">0595414472</a></li>
              <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-[#3FBF80]" /><a href="mailto:niyar@powercares.pro" className="hover:text-[#3FBF80]">niyar@powercares.pro</a></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto max-w-[1200px]">
          <IpCertificateBadge lang={lang} />
        </div>
      </footer>
    </div>
  );
}
