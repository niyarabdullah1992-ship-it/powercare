import React, { useEffect } from "react";
import MarketingChrome from "@/components/landing/MarketingChrome";
import LandingProofStrip from "@/components/landing/LandingProofStrip";
import EnterprisePilotPath from "@/components/landing/EnterprisePilotPath";
import MhrsdComplianceModules from "@/components/landing/MhrsdComplianceModules";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { trackVisit } from "@/lib/trackVisit";
import {
  ACCENT,
  BORDER,
  BRAND_BORDER,
  BRAND_SOFT,
  CARD,
  INK,
  MUTED,
  NAVY, NAVY_FILL,
  ON_NAVY,
  ON_NAVY_ACCENT,
  ON_NAVY_MUTED,
  SURFACE,
} from "@/lib/publicChrome";

/** Minimal stroke icons — Landing.dc.html L273–278 shape. */
function ModIcon({ paths, color }) {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

const PATHS = {
  day: ["M5 3.5h14v17H5z", "M8.5 8h7", "M8.5 12h7", "M8.5 16h4"],
  org: ["M9.5 3.5h5v4h-5z", "M3 16.5h5v4H3z", "M16 16.5h5v4h-5z", "M12 7.5v3", "M5.5 16.5v-3h13v3"],
  cal: ["M4 6.5h16v14H4z", "M4 10.5h16", "M8.5 3.5v4", "M15.5 3.5v4"],
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M14 14h6v6h-6z", "M4 14h6v6H4z"],
  ops: ["M9 11.5l2.2 2.2L16 9", "M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"],
  clock: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z", "M12 7.5V12l3 1.8"],
  camera: ["M4 8h3l1.6-2.2h6.8L17 8h3v11H4z", "M9.4 13.2l1.8 1.8 3.4-3.6"],
  shield: ["M12 3l7.5 3v5.5c0 4.6-3.1 7.7-7.5 9.5-4.4-1.8-7.5-4.9-7.5-9.5V6z", "M12 9v4", "M12 16.2h.01"],
  box: ["M20.5 7.8L12 3 3.5 7.8 12 12.6z", "M3.5 7.8v8.4L12 21l8.5-4.8V7.8"],
  chat: ["M20.5 4.5h-17v11h4v4l4.5-4h8.5z"],
  users: ["M9.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M3 20a6.5 6.5 0 0 1 13 0", "M17 10.5a3 3 0 1 0 0-6", "M18.5 20a6 6 0 0 0-2.6-4.9"],
  trend: ["M3.5 16.5l5-5 3.5 3.5 8-8", "M15.5 7h4.5v4.5"],
  wallet: ["M4 7.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h11", "M16.5 13.5h.01"],
  receipt: ["M6 3.5h12v17l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.5z", "M9.5 9h5", "M9.5 13h5"],
  folder: ["M3.5 6.5h6l2 2.5h9v9.5h-17z"],
  pen: ["M12.5 20H21", "M16.6 3.9a2.1 2.1 0 0 1 3 3L7.4 19.1 3.5 20.2l1.1-3.9z"],
  message: ["M20.5 12a8 8 0 0 1-8 8H7l-3.5 2.5V12a8 8 0 0 1 8-8h1a8 8 0 0 1 8 8z"],
  chart: ["M4.5 20V11", "M10 20V4.5", "M15.5 20v-6", "M21 20H3.5"],
  spark: ["M12 3.5l1.9 5.3 5.3 1.9-5.3 1.9L12 17.9l-1.9-5.3L4.8 10.7l5.3-1.9z"],
  brief: ["M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7", "M4 8.5h16v11H4z", "M4 12.5h16"],
};

/** Same 21 live sidebar sections — settings stays inside the app, not on the public grid. */
const MOD_DEFS = [
  ["grid", "مركز القيادة", "Command Center", true],
  ["clock", "الحضور والانصراف", "Attendance", false],
  ["ops", "المهام والعمليات", "Operations", false],
  ["camera", "إثبات العمل", "Work Proof", false],
  ["pen", "التوقيع الرقمي", "Digital Signing", false],
  ["day", "التقرير اليومي", "Daily Report", false],
  ["chart", "التقارير والتحليلات", "Reports & Analytics", false],
  ["chat", "المحادثات التشغيلية", "Operations Chat", false],
  ["clock", "الورديات", "Shifts", false],
  ["cal", "طلبات الإجازة", "Leave Requests", false],
  ["users", "الموارد البشرية", "Human Resources", false],
  ["brief", "التوظيف", "Recruitment", false],
  ["trend", "الأداء", "Performance", false],
  ["org", "الهيكل التنظيمي", "Org Structure", false],
  ["shield", "السلامة HSE", "Safety HSE", false],
  ["message", "صوت الموظف", "Employee Voice", false],
  ["wallet", "الرواتب", "Payroll", false],
  ["receipt", "المصروفات", "Expenses", false],
  ["box", "المخزون والأصول", "Inventory & Assets", false],
  ["folder", "الملفات", "Files", false],
  ["spark", "المساعد الذكي", "AI Assistant", false],
];

const PAD = { paddingLeft: "48px", paddingRight: "48px" };

/**
 * Marketing landing — NiroVera Landing.dc.html L30–266 (inline styles AS-IS).
 * App-only marketing blocks demoted below primary.
 */
export default function Landing() {
  const { lang, setLang } = useI18n();
  const { session, currentUser } = useAuth();
  const loggedIn = Boolean(session?.userId && currentUser);
  const ar = lang === "ar";
  const T = (a, e) => (ar ? a : e);
  const numAlign = ar ? "right" : "left";

  useEffect(() => {
    trackVisit("/");
  }, []);

  /** First-viewport MHRSD strip — honest live-gov status (not decorative). */
  const heroGov = [
    { title: T("طلبات الإجازة", "Leave Requests"), note: T("الاستحقاق ونهاية الخدمة", "Entitlement & end-of-service"), chip: T("جاهز في المنصة", "Ready in product"), live: false, href: "#mhrsd-leave" },
    { title: T("الموارد البشرية", "Human Resources"), note: T("نظام العمل والعقود", "Labour Law & contracts"), chip: T("جاهز في المنصة", "Ready in product"), live: false, href: "#mhrsd-hr" },
    { title: T("التوظيف", "Recruitment"), note: T("قوى · التأمينات · نطاقات", "Qiwa · GOSI · Nitaqat"), chip: T("قيد الربط الحي", "Live link pending"), live: true, href: "#mhrsd-hiring" },
    { title: T("الرواتب", "Payroll"), note: T("حماية الأجور · مدى / WPS", "Wage protection · Mudad / WPS"), chip: T("قيد الربط الحي", "Live link pending"), live: true, href: "#mhrsd-payroll" },
  ];

  const problems = [
    { value: "7", text: T("أدوات منفصلة في المتوسط: إكسل، واتساب، ورق، بريد، ونظام حضور مستقل.", "Seven separate tools on average: spreadsheets, chat apps, paper, email and a standalone attendance system.") },
    { value: "3h", text: T("يوميًا من وقت المشرفين تذهب في جمع البيانات وتجميع التقارير يدويًا.", "Three hours of supervisor time a day spent collecting data and assembling reports by hand.") },
    { value: "48h", text: T("متوسط التأخير حتى تصل مشكلة ميدانية إلى من يملك قرار حلّها.", "The average delay before a field problem reaches the person who can decide on it.") },
  ];

  const proofPoints = [
    T("الحضور يُتحقق منه بموقع الفرع، لا بضغطة زر من أي مكان.", "Attendance is verified against the station's location, not a button press from anywhere."),
    T("كل تغيير على البيانات يُسجَّل تلقائيًا: من، ومتى، وماذا تغيّر بالضبط.", "Every data change is logged automatically: who, when, and exactly what changed."),
    T("البلاغ المجهول يصل برمز متغيّر كل ثلاثين يومًا، فلا يُربط بصاحبه من داخل النظام.", "Anonymous reports arrive under a code that rotates every thirty days, so they can't be traced from inside the system."),
  ];

  const compareRows = [
    { criterion: T("مدة التطبيق", "Implementation time"), legacy: T("6 إلى 18 شهرًا", "6 to 18 months"), nirovera: T("أسبوعان", "Two weeks") },
    { criterion: T("التدريب المطلوب", "Training required"), legacy: T("دورات لكل وحدة", "A course per module"), nirovera: T("الفني يسجّل حضوره من هاتفه بلا تدريب", "Technicians check in from their phone with no training") },
    { criterion: T("اللغة والاتجاه", "Language and direction"), legacy: T("عربية مضافة على واجهة إنجليزية", "Arabic bolted onto an English interface"), nirovera: T("عربية أصلية من اليمين لليسار", "Native right-to-left Arabic") },
    { criterion: T("العمل الميداني", "Field work"), legacy: T("إدخال لاحق من المكتب", "Entered later from the office"), nirovera: T("إثبات مصوّر مختوم بالموقع والوقت", "Photo proof stamped with location and time") },
    { criterion: T("امتثال الوزارة", "Ministry compliance"), legacy: T("ملفات منفصلة وتذكير يدوي", "Separate files and manual reminders"), nirovera: T("بوابات نظام العمل · WPS · GOSI · قوى · نطاقات", "Labour Law gates · WPS · GOSI · Qiwa · Nitaqat") },
    { criterion: T("التكلفة السنوية", "Annual cost"), legacy: T("مئات الآلاف قبل التخصيص", "Hundreds of thousands before customization"), nirovera: T("اشتراك ثابت بلا رسوم تطبيق", "A flat subscription with no implementation fee") },
    { criterion: T("مسار الشركات الكبيرة", "Enterprise entry"), legacy: T("استبدال كامل أو لا شيء", "Full rip-and-replace or nothing"), nirovera: T("تجريب موقع واحد 90 يومًا فوق النظام الحالي", "90-day one-site pilot on top of your current stack") },
  ];

  const plans = [
    {
      name: T("البداية", "Starter"),
      tag: "",
      price: "29",
      unit: T("ريال / موظف / شهر", "SAR / employee / month"),
      desc: T("المهام والحضور والمحادثات والملفات. حتى 30 موظفًا وفرعين.", "Tasks, attendance, chat and files. Up to 30 employees and 2 stations."),
      cta: T("ابدأ", "Get started"),
      dark: false,
      priceBig: true,
    },
    {
      name: T("الاحترافية", "Professional"),
      tag: T("الأكثر اختيارًا", "Most chosen"),
      price: "49",
      unit: T("ريال / موظف / شهر", "SAR / employee / month"),
      desc: T("كل الوحدات الإحدى والعشرين، بما فيها الرواتب والتوظيف والتوقيع الرقمي ومركز امتثال الوزارة والمساعد الذكي.", "All twenty-one modules, including payroll, hiring, digital signing, MHRSD compliance centre and the AI assistant."),
      cta: T("ابدأ التجربة", "Start trial"),
      dark: true,
      priceBig: true,
    },
    {
      name: T("المؤسسات", "Enterprise"),
      tag: "",
      price: T("حسب الاتفاق", "Custom"),
      unit: "",
      desc: T("تجريب موقع واحد، تكامل لاحق مع الأنظمة القائمة، عزل بيانات الشركة، ودعم تشغيلي مسمّى.", "One-site pilot, later integration with your stack, company data isolation, and a named ops contact."),
      cta: T("اطلب تجريب موقع", "Request a site pilot"),
      dark: false,
      priceBig: false,
    },
  ];

  const security = [
    { title: T("التزام نظامي مبني في الملف", "Regulatory compliance built into the file"), text: T("ملف الموظف يحمل الإقامة ورخصة العمل والتأمينات والمسمى في قوى، ويُنبَّه تلقائيًا قبل انتهاء أي منها بستين يومًا — بوابات بأسماء أسباب.", "Each employee file carries Iqama, work permit, GOSI and the Qiwa job title, and flags any of them sixty days before expiry — named gates.") },
    { title: T("حماية الأجور ونطاقات", "Wage protection & Nitaqat"), text: T("صفوف مدى/WPS مشتقة قبل الإيداع، ونسبة التوطين من السجل — الإرسال الحي لقوى والتأمينات ومدى قيد الربط عند الاعتمادات.", "Mudad/WPS rows derived before deposit, and Saudization from the register — live Qiwa/GOSI/Mudad send pending credentials.") },
    { title: T("سجل تدقيق تلقائي", "Automatic audit trail"), text: T("كل تغيير على البيانات يُسجَّل من مصدره — دون أن يعتمد على انضباط المستخدم أو تذكّره.", "Every data change is logged at its source — it doesn't depend on user discipline or memory.") },
    { title: T("صلاحيات وتصعيد", "Permissions & escalation"), text: T("الصلاحية من الدور والهيكل معًا؛ البلاغات تُصعَّد تلقائيًا عند تجاوز زمن الاستجابة.", "Access from role and org structure together; reports escalate automatically when response time is breached.") },
  ];

  return (
    <MarketingChrome ar={ar} lang={lang} loggedIn={loggedIn} onToggleLang={() => setLang(ar ? "en" : "ar")}>
      <style>{`
        @media (max-width: 900px) {
          [data-nv="split"] { flex-direction: column !important; }
          [data-nv="h1"] { font-size: 40px !important; }
          [data-nv="h2"] { font-size: 30px !important; }
          [data-nv="proof-grid"] { grid-template-columns: 1fr 1fr !important; }
          [data-nv="mod-grid"] { grid-template-columns: 1fr 1fr !important; }
          [data-nv="hero-gov"] { grid-template-columns: 1fr 1fr !important; }
        }
        @media (min-width: 901px) {
          [data-nv="proof-arrow"] { display: inline !important; }
        }
      `}</style>

      {/* Hero — brand + Proof Cycle + Saudi HCM */}
      <section
        data-nv="pad"
        style={{
          padding: "88px 48px 72px",
          background: `linear-gradient(165deg, color-mix(in oklab, ${NAVY} 8%, ${SURFACE}) 0%, ${SURFACE} 42%, ${SURFACE} 100%)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            pointerEvents: "none",
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 50% at 100% 0%, rgba(30,158,99,0.08), transparent 55%), radial-gradient(ellipse 45% 40% at 0% 80%, rgba(20,40,75,0.06), transparent 50%)",
          }}
        />
        <div style={{ maxWidth: "1240px", margin: "0 auto", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "9px", padding: "7px 14px", borderRadius: "20px", border: `1px solid ${BRAND_BORDER}`, background: BRAND_SOFT }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: ACCENT }} />
            <span style={{ fontSize: "13px", color: "var(--nv-accent-deep)", fontWeight: 500 }}>{T("منصة سعودية · امتثال وزارة الموارد البشرية · عربية أولاً", "Saudi platform · MHRSD-aligned · Arabic-first")}</span>
          </div>
          <p style={{ margin: "22px 0 0", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "13px", fontWeight: 600, letterSpacing: "0.16em", color: MUTED }}>
            NIROVERA
          </p>
          <h1 data-nv="h1" style={{ margin: "10px 0 0", fontSize: "62px", fontWeight: 600, lineHeight: 1.18, letterSpacing: "-0.03em", maxWidth: "920px", textWrap: "pretty" }}>
            {T("تشغيل ميداني يثبت العمل — وامتثال صاحب العمل في سلسلة واحدة", "Field operations that prove work — and employer compliance in one chain")}
          </h1>
          <p style={{ margin: "26px 0 0", fontSize: "20px", lineHeight: 1.65, color: MUTED, maxWidth: "740px", textWrap: "pretty" }}>
            {T("نثبت أن العمل تم: حضور ومهمة واعتماد وتوقيع وإثبات للعميل — فوق أنظمتكم الحالية أو من فرع واحد. عزل بيانات، تدقيق، وعربي للميدان.", "We prove work was done: attendance, task, review, sign-off and client proof — on top of your current systems or from one station. Data isolation, audit, Arabic for the field.")}
          </p>
          <div style={{ display: "flex", gap: "12px", marginTop: "34px", flexWrap: "wrap" }}>
            <a href="#enterprise-pilot" style={{ height: "48px", padding: "0 26px", borderRadius: "9px", background: NAVY_FILL, color: ON_NAVY, fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", textDecoration: "none" }}>
              {T("تجريب للمؤسسات — موقع واحد", "Enterprise pilot — one site")}
            </a>
            <a href="#pricing" style={{ height: "48px", padding: "0 26px", borderRadius: "9px", background: CARD, color: INK, border: `1px solid ${BORDER}`, fontSize: "15px", fontWeight: 500, display: "flex", alignItems: "center", textDecoration: "none" }}>
              {T("ابدأ الاشتراك", "Start subscription")}
            </a>
          </div>

          <div
            data-nv="split"
            style={{
              marginTop: "56px",
              background: NAVY_FILL,
              borderRadius: "16px",
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: "0 1 300px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "11px", letterSpacing: "0.12em", color: ON_NAVY_ACCENT, fontWeight: 600 }}>
                {T("امتثال وزارة الموارد البشرية", "MHRSD EMPLOYER COMPLIANCE")}
              </div>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 600, lineHeight: 1.35, color: ON_NAVY, letterSpacing: "-0.02em", textWrap: "pretty" }}>
                {T("التزامات صاحب العمل داخل سلسلة الإثبات", "Employer obligations inside the Proof Cycle")}
              </h2>
              <p style={{ margin: 0, fontSize: "13px", lineHeight: 1.6, color: ON_NAVY_MUTED }}>
                {T("أسماء الأقسام كما في المنصة. الجاهز = بوابات داخل نيروفيرا، لا إرسال حي للحكومة.", "Same section names as the app. Ready = in-product gates, not a live government send.")}
              </p>
              <a href="#mhrsd" style={{ height: "40px", padding: "0 16px", borderRadius: "9px", background: ACCENT, color: ON_NAVY, fontSize: "13px", fontWeight: 600, display: "inline-flex", alignItems: "center", alignSelf: "flex-start", textDecoration: "none" }}>
                {T("كل وحدات الامتثال", "All compliance modules")}
              </a>
            </div>
            <div
              data-nv="hero-gov"
              style={{
                flex: "1 1 440px",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gridAutoRows: "1fr",
                gap: "10px",
              }}
            >
              {heroGov.map((g) => (
                <a
                  key={g.title}
                  href={g.href}
                  style={{
                    background: "rgba(255,255,255,.05)",
                    border: "1px solid rgba(255,255,255,.1)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                    textDecoration: "none",
                    color: "inherit",
                    height: "100%",
                    boxSizing: "border-box",
                  }}
                >
                  <span
                    style={{
                      height: "22px",
                      padding: "0 9px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: g.live ? "rgba(148,163,184,.15)" : "rgba(30,158,99,.18)",
                      color: g.live ? "#CBD5E1" : "#6EE7B7",
                      border: `1px solid ${g.live ? "rgba(148,163,184,.35)" : "rgba(110,231,183,.35)"}`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: g.live ? "#94A3B8" : "#6EE7B7" }} />
                    {g.chip}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: ON_NAVY, lineHeight: 1.4 }}>{g.title}</span>
                  {g.note ? (
                    <span style={{ fontSize: "12px", color: ON_NAVY_MUTED, lineHeight: 1.45 }}>{g.note}</span>
                  ) : null}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LandingProofStrip ar={ar} />

      <EnterprisePilotPath ar={ar} />

      <MhrsdComplianceModules ar={ar} loggedIn={loggedIn} />

      {/* L85–98 problem */}
      <section data-nv="pad" style={{ padding: "72px 48px", background: CARD, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em" }}>{T("لماذا تتأخر القرارات التشغيلية", "Why operational decisions run late")}</h2>
          <p style={{ margin: "16px 0 0", fontSize: "18px", color: MUTED, maxWidth: "700px", lineHeight: 1.65 }}>{T("المعلومة موجودة، لكنها موزّعة على أدوات لا تتحدث مع بعضها.", "The information exists, but it's spread across tools that don't talk to each other.")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "22px", marginTop: "46px" }}>
            {problems.map((p) => (
              <div key={p.value} style={{ borderTop: `2px solid ${NAVY}`, paddingTop: "24px" }}>
                <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "52px", fontWeight: 600, lineHeight: 1, letterSpacing: "-0.03em", textAlign: numAlign }}>{p.value}</div>
                <p style={{ margin: "16px 0 0", fontSize: "16px", lineHeight: 1.7, color: MUTED, textWrap: "pretty" }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L100–113 modules */}
      <section id="modules" data-nv="pad" style={{ padding: "80px 48px", background: SURFACE }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em" }}>{T("إحدى وعشرون وحدة، قاعدة بيانات واحدة", "Twenty-one modules, one database")}</h2>
          <p style={{ margin: "16px 0 0", fontSize: "18px", color: MUTED, maxWidth: "760px", lineHeight: 1.65 }}>{T("تسجيل حضور واحد يغذّي الجدولة والرواتب والأداء والتقارير معًا — دون إعادة إدخال ولا تصدير واستيراد.", "A single check-in feeds scheduling, payroll, performance and reporting together — no re-entry, no export-import.")}</p>
          <div data-nv="mod-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginTop: "44px" }}>
            {MOD_DEFS.map(([ic, arLabel, enLabel, primary]) => (
              <div
                key={enLabel}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "18px 20px",
                  borderRadius: "16px",
                  border: `1px solid ${primary ? NAVY : BORDER}`,
                  background: primary ? NAVY : CARD,
                  color: primary ? ON_NAVY : INK,
                  boxShadow: primary ? "none" : "0 8px 24px rgba(20,40,75,.06)",
                  overflow: "hidden",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", color: primary ? ON_NAVY_ACCENT : ACCENT, flexShrink: 0 }}>
                  <ModIcon paths={PATHS[ic]} color="currentColor" />
                </span>
                <span style={{ fontSize: "15px", fontWeight: 500 }}>{ar ? arLabel : enLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L115–153 proof */}
      <section data-nv="pad" style={{ padding: "80px 48px", background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div data-nv="split" style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", gap: "56px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 340px" }}>
            <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: ACCENT, fontWeight: 600 }}>{T("إثبات العمل", "WORK PROOF")}</div>
            <h2 data-nv="h2" style={{ margin: "18px 0 0", fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em", textWrap: "pretty" }}>{T("العمل يُغلق بصورة مختومة بالموقع والوقت", "Work closes with a photo stamped by location and time")}</h2>
            <p style={{ margin: "20px 0 0", fontSize: "17px", lineHeight: 1.75, color: MUTED, textWrap: "pretty" }}>{T("الفني يلتقط صورة قبل وبعد من داخل نطاق الفرع. الرفع من خارج النطاق يُرفض تلقائيًا، فلا يمكن إغلاق عمل لم يُنفَّذ.", "The technician captures a before and after photo from inside the station's geofence. Uploads from outside are rejected automatically, so work that wasn't done can't be closed.")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "30px" }}>
              {proofPoints.map((text) => (
                <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: BRAND_SOFT, border: `1px solid ${BRAND_BORDER}`, color: "var(--nv-accent-deep)", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>✓</span>
                  <span style={{ fontSize: "16px", lineHeight: 1.65, color: INK, textWrap: "pretty" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "1 1 340px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: "16px", padding: "26px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: "12px", flex: 1, minHeight: "190px" }}>
              {[T("قبل", "BEFORE"), T("بعد", "AFTER")].map((label, i) => (
                <div key={label} style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", color: MUTED, letterSpacing: "0.08em" }}>{label}</span>
                  <span dir="ltr" style={{ fontSize: "13px", color: MUTED, fontFamily: "'IBM Plex Sans',sans-serif" }}>{i === 0 ? "06:18" : "09:42"}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "18px", paddingTop: "18px", borderTop: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: MUTED }}>{T("داخل نطاق الجبيل 2 · 12 مترًا", "Inside Jubail 2 geofence · 12m")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: BORDER, flexShrink: 0 }} />
                <span style={{ fontSize: "14px", color: MUTED }}>{T("راجعه فهد القحطاني", "Reviewed by F. Alqahtani")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* L155–175 assistant */}
      <section data-nv="pad" style={{ padding: "80px 48px", background: NAVY_FILL, color: ON_NAVY }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <div style={{ fontSize: "12px", letterSpacing: "0.12em", color: ON_NAVY_ACCENT, fontWeight: 600 }}>{T("المساعد الذكي", "AI ASSISTANT")}</div>
          <h2 data-nv="h2" style={{ margin: "18px 0 0", fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em", maxWidth: "800px", textWrap: "pretty" }}>{T("يقرأ بيانات شركتك، ويعرض مصدر كل رقم", "It reads your company's data and shows the source behind every number")}</h2>
          <div style={{ marginTop: "38px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "18px", padding: "32px" }}>
            <div style={{ fontSize: "12px", color: ON_NAVY_ACCENT, fontWeight: 600, letterSpacing: "0.08em" }}>{T("السؤال", "QUESTION")}</div>
            <p style={{ margin: "14px 0 0", fontSize: "24px", fontWeight: 500, lineHeight: 1.5, textWrap: "pretty" }}>{T("لماذا انخفض إنجاز المهام في فرع الجبيل 2 هذا الأسبوع؟", "Why did task completion drop at Jubail 2 this week?")}</p>
            <div style={{ height: "1px", background: "rgba(255,255,255,.1)", margin: "26px 0" }} />
            <p style={{ margin: 0, fontSize: "17px", lineHeight: 1.8, color: ON_NAVY_MUTED, maxWidth: "920px", textWrap: "pretty" }}>{T("الانخفاض مصدره سبب واحد: توقف مضخة التبريد يوم الأحد أوقف 3 مهام معتمدة عليها، ولم تُعَد جدولتها. الحضور والطاقم لم يتغيرا.", "The drop traces to a single cause: Sunday's cooling pump stoppage blocked 3 dependent tasks that were never rescheduled. Attendance and crew levels were unchanged.")}</p>
            <div style={{ display: "flex", gap: "14px", marginTop: "28px", flexWrap: "wrap" }}>
              {[
                { source: T("العمليات", "OPERATIONS"), value: "-23%" },
                { source: T("الحضور", "ATTENDANCE"), value: "0%" },
                { source: T("الأصول", "ASSETS"), value: "31h" },
              ].map((e) => (
                <div key={e.source} style={{ flex: "1 1 150px", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: "12px", padding: "18px" }}>
                  <div style={{ fontSize: "11px", color: ON_NAVY_MUTED, letterSpacing: "0.08em" }}>{e.source}</div>
                  <div dir="ltr" style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "30px", fontWeight: 600, marginTop: "8px", textAlign: numAlign }}>{e.value}</div>
                </div>
              ))}
              <div style={{ flex: "1 1 200px", background: ACCENT, borderRadius: "12px", padding: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 600, textAlign: "center" }}>
                {T("أعد جدولة المهام الثلاث", "Reschedule the 3 tasks")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* L177–199 compare */}
      <section data-nv="pad" style={{ padding: "80px 48px", background: CARD }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em" }}>{T("مقارنة بأنظمة الموارد التقليدية", "Compared with a traditional ERP")}</h2>
          <div style={{ marginTop: "40px", border: `1px solid ${BORDER}`, borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: "760px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: NAVY_FILL, color: ON_NAVY }}>
                  <div style={{ padding: "18px 24px", fontSize: "14px", fontWeight: 600 }}>{T("المعيار", "Criterion")}</div>
                  <div style={{ padding: "18px 24px", fontSize: "14px", fontWeight: 600, color: ON_NAVY_MUTED }}>{T("نظام موارد تقليدي", "Traditional ERP")}</div>
                  <div style={{ padding: "18px 24px", fontSize: "14px", fontWeight: 600, color: ON_NAVY_ACCENT }}>NiroVera</div>
                </div>
                {compareRows.map((r) => (
                  <div key={r.criterion} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{ padding: "20px 24px", fontSize: "15px", fontWeight: 500 }}>{r.criterion}</div>
                    <div style={{ padding: "20px 24px", fontSize: "15px", color: MUTED }}>{r.legacy}</div>
                    <div style={{ padding: "20px 24px", fontSize: "15px", color: INK, fontWeight: 500 }}>{r.nirovera}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* L201–225 pricing */}
      <section id="pricing" data-nv="pad" style={{ padding: "80px 48px", background: SURFACE, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em" }}>{T("الأسعار", "Pricing")}</h2>
          <p style={{ margin: "16px 0 0", fontSize: "18px", color: MUTED, maxWidth: "640px", lineHeight: 1.65 }}>{T("سعر لكل موظف شهريًا، بلا رسوم تهيئة ولا فريق تطبيق مقيم.", "Priced per employee per month, with no setup fee and no on-site implementation team.")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "20px", marginTop: "44px" }}>
            {plans.map((p) => (
              <div
                key={p.name}
                style={{
                  background: p.dark ? NAVY : CARD,
                  border: `1px solid ${p.dark ? NAVY : BORDER}`,
                  borderRadius: "16px",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  color: p.dark ? ON_NAVY : INK,
                  minHeight: "290px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 600 }}>{p.name}</span>
                  {!!p.tag && (
                    <span style={{ fontSize: "11px", background: ACCENT, color: ON_NAVY, borderRadius: "20px", padding: "4px 11px", fontWeight: 600 }}>{p.tag}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "9px", marginTop: "18px" }}>
                  <span
                    dir="ltr"
                    style={
                      p.priceBig
                        ? { fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "42px", fontWeight: 600, lineHeight: 1 }
                        : { fontSize: "30px", fontWeight: 600, lineHeight: 1 }
                    }
                  >
                    {p.price}
                  </span>
                  {!!p.unit && (
                    <span style={{ fontSize: "14px", color: p.dark ? ON_NAVY_MUTED : MUTED }}>{p.unit}</span>
                  )}
                </div>
                <p style={{ margin: "20px 0 0", fontSize: "16px", lineHeight: 1.7, color: p.dark ? ON_NAVY_MUTED : MUTED }}>{p.desc}</p>
                <div style={{ flex: 1 }} />
                <a
                  href="#contact"
                  style={{
                    marginTop: "26px",
                    height: "44px",
                    borderRadius: "9px",
                    background: p.dark ? ACCENT : SURFACE,
                    border: p.dark ? "none" : `1px solid ${BORDER}`,
                    color: p.dark ? ON_NAVY : INK,
                    fontSize: "14px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                  }}
                >
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* L227–239 security */}
      <section id="trust" data-nv="pad" style={{ padding: "80px 48px", background: CARD, borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "40px", fontWeight: 600, letterSpacing: "-0.02em" }}>{T("الأمان وامتثال صاحب العمل", "Security and employer compliance")}</h2>
          <p style={{ margin: "16px 0 0", fontSize: "17px", color: MUTED, maxWidth: "720px", lineHeight: 1.65 }}>
            {T("بوابات مشتقة من نظام العمل والملف النظامي — مع شارات صادقة لحالة الربط الحكومي (قوى · التأمينات · مدى).", "Gates derived from Labour Law and the statutory file — with honest chips for government-link status (Qiwa · GOSI · Mudad).")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "26px", marginTop: "44px" }}>
            {security.map((s) => (
              <div key={s.title} style={{ borderTop: `2px solid ${ACCENT}`, paddingTop: "22px" }}>
                <div style={{ fontSize: "19px", fontWeight: 600 }}>{s.title}</div>
                <p style={{ margin: "12px 0 0", fontSize: "16px", lineHeight: 1.7, color: MUTED, textWrap: "pretty" }}>{s.text}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "36px" }}>
            <a
              href={loggedIn ? "/app/hr#compliance-center" : "#mhrsd"}
              style={{
                height: "44px",
                padding: "0 22px",
                borderRadius: "9px",
                background: NAVY_FILL,
                color: ON_NAVY,
                fontSize: "14px",
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
              }}
            >
              {loggedIn
                ? T("مركز امتثال الموارد البشرية", "HR compliance centre")
                : T("وحدات الامتثال", "Compliance modules")}
            </a>
          </div>
        </div>
      </section>

      {/* L241–250 contact */}
      <section id="contact" data-nv="pad" style={{ padding: "88px 48px", background: NAVY_FILL, color: ON_NAVY }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
          <h2 data-nv="h2" style={{ margin: 0, fontSize: "48px", fontWeight: 600, letterSpacing: "-0.025em", maxWidth: "800px", lineHeight: 1.25, textWrap: "pretty" }}>{T("فرع واحد — قيسوا الإثبات قبل التوسّع", "One station — measure proof before you scale")}</h2>
          <p style={{ margin: "22px 0 0", fontSize: "19px", color: ON_NAVY_MUTED, maxWidth: "700px", lineHeight: 1.65, textWrap: "pretty" }}>{T("للمؤسسات: تجريب 90 يومًا على موقع واحد فوق أنظمتكم الحالية. للصفقات الأصغر: فرع واحد خلال أسبوعين بلا التزام.", "Enterprises: a 90-day pilot on one site on top of your current stack. Smaller deals: one station in two weeks, no commitment.")}</p>
          <div style={{ display: "flex", gap: "12px", marginTop: "34px", flexWrap: "wrap" }}>
            <a href="mailto:niyar@powercares.pro?subject=NiroVera%20Enterprise%20Pilot" style={{ height: "50px", padding: "0 28px", borderRadius: "9px", background: ACCENT, color: ON_NAVY, fontSize: "15px", fontWeight: 600, display: "flex", alignItems: "center", textDecoration: "none" }}>{T("اطلب تجريب موقع", "Request a site pilot")}</a>
            <a href="tel:+966595414472" dir="ltr" style={{ height: "50px", padding: "0 28px", borderRadius: "9px", background: "transparent", color: ON_NAVY, border: "1px solid rgba(255,255,255,.2)", fontSize: "15px", fontWeight: 500, display: "flex", alignItems: "center", textDecoration: "none" }}>+966 59 541 4472</a>
          </div>
        </div>
      </section>

    </MarketingChrome>
  );
}
