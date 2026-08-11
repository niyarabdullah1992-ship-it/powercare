import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe, ChevronDown, Check, Phone, Mail, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import MobileFieldHero from "@/components/landing/MobileFieldHero";
import MobileFieldScreens from "@/components/landing/MobileFieldScreens";
import IpCertificateBadge from "@/components/landing/IpCertificateBadge";
import { useI18n } from "@/lib/i18n";
import { trackVisit } from "@/lib/trackVisit";

const CHAIN = [
  {
    ar: "الحضور يثبت المكان والوقت",
    en: "Attendance proves place and time",
    to: "/app/attendance",
  },
  {
    ar: "المهمة تحمل وزن الجهد والإسناد",
    en: "Tasks carry effort weight and assignment",
    to: "/app/tasks",
  },
  {
    ar: "الإثبات يغلق العمل بصورة مختومة",
    en: "Proof closes work with a stamped photo",
    to: "/app/work-proof",
  },
  {
    ar: "البلاغ المجهول يحمي الصوت الميداني",
    en: "Anonymous report protects the field voice",
    to: "/app/complaints",
  },
];

export default function Mobile() {
  const { t, lang, setLang, languages } = useI18n();
  const [langOpen, setLangOpen] = useState(false);
  const ar = lang === "ar";
  const currentLang = languages.find((l) => l.code === lang);

  useEffect(() => {
    trackVisit("/mobile");
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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B1A3F]/92 text-white backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-6 md:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo size={24} />
            <span className="font-heading text-base font-semibold tracking-tight">NiroVera</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-5 sm:flex">
            <Link to="/" className="text-[12.8px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الرئيسية" : "Home"}
            </Link>
            <a href="#field-screens" className="text-[12.8px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "الشاشات" : "Screens"}
            </a>
            <a href="#proof-chain" className="text-[12.8px] text-[#B9C3D8] transition-colors hover:text-white">
              {ar ? "دورة الإثبات" : "Proof cycle"}
            </a>
          </nav>
          <div className="ms-auto flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangOpen((v) => !v);
                }}
                className="flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-2.5 py-2 text-xs text-[#C7D2E6] hover:bg-white/10"
              >
                <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">{currentLang?.flag}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
              </button>
              {langOpen && (
                <div className="absolute end-0 z-50 mt-2 max-h-72 w-48 overflow-y-auto rounded-lg border border-[#E4E7EC] bg-white py-1 text-[#101828] shadow-xl">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-sm ${
                        lang === l.code ? "bg-[#E8F3ED] text-[#0E7A4B]" : "hover:bg-[#F7F8FA]"
                      }`}
                    >
                      <span>
                        {l.flag} {l.label}
                      </span>
                      {lang === l.code && <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link
              to="/login"
              state={{ from: "/app/attendance" }}
              className="rounded-lg bg-[#0E7A4B] px-3.5 py-2 text-[13px] text-white hover:bg-[#0B5F3A]"
            >
              {ar ? "دخول" : "Sign in"}
            </Link>
          </div>
        </div>
      </header>

      <MobileFieldHero ar={ar} />

      <MobileFieldScreens ar={ar} />

      <section id="proof-chain" className="bg-white">
        <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-8 md:py-[72px]">
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#0E7A4B]">
            {ar ? "من الجيب إلى المنصة" : "POCKET TO PLATFORM"}
          </p>
          <h2 className="mt-3 max-w-xl font-heading text-[28px] font-semibold text-[#0B1A3F] md:text-[32px]">
            {ar ? "نفس دورة الإثبات — بدون شاشات المكتب" : "The same proof cycle — without the desk UI"}
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.85] text-[#5A6478]">
            {ar
              ? "كل فعل ميداني يغذي الحضور والمهام والإثبات والبلاغ في المنصة. لا مسار موازٍ ولا أرقام ثابتة على الشاشة."
              : "Every field action feeds attendance, tasks, proof, and complaints in the platform. No parallel path, no hard-coded numbers on screen."}
          </p>
          <ol className="mt-10 grid gap-0 border border-[#E4E7EC] md:grid-cols-4">
            {CHAIN.map((item, i) => (
              <li
                key={item.en}
                className="border-b border-[#E4E7EC] p-5 last:border-b-0 md:border-b-0 md:border-e md:last:border-e-0"
              >
                <span className="font-heading text-[12px] font-semibold text-[#0E7A4B]" dir="ltr">
                  0{i + 1}
                </span>
                <p className="mt-2 text-[14px] font-medium leading-snug text-[#0B1A3F]">
                  {ar ? item.ar : item.en}
                </p>
                <Link
                  to="/login"
                  state={{ from: item.to }}
                  className="mt-3 inline-block text-[12.5px] text-[#0E7A4B] hover:underline"
                >
                  {ar ? "افتح في المنصة" : "Open in platform"}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#0B1A3F]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-8 md:py-[72px]">
          <div className="max-w-lg">
            <h2 className="m-0 font-heading text-[26px] font-semibold text-white md:text-[30px]">
              {ar ? "جاهز ليوم الميدان؟" : "Ready for the field day?"}
            </h2>
            <p className="mt-3 text-[14.5px] leading-[1.8] text-[#B9C3D8]">
              {ar
                ? "ادخل بحساب الشركة أو الجهة — الشاشات الأربع فوق نفس جلسة المنصة وصلاحياتها."
                : "Sign in with your company account — the four screens sit on the same platform session and permissions."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              state={{ from: "/app/attendance" }}
              className="institutional-cta rounded-[10px] bg-[#0E7A4B] px-7 py-3.5 text-[15px] font-medium text-white hover:bg-[#0B5F3A]"
            >
              {ar ? "دخول الميدان" : "Enter the field"}
            </Link>
            <Link
              to="/"
              className="rounded-[10px] border border-white/25 bg-white/5 px-7 py-3.5 text-[15px] text-white hover:bg-white/10"
            >
              {ar ? "العودة للرئيسية" : "Back to home"}
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#08142F] px-6 py-8 md:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-7 md:grid-cols-3">
          <div>
            <h3 className="font-heading text-2xl text-white">NiroVera</h3>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              {ar
                ? "تطبيق الفني الميداني — حضور، مهام، إثبات، بلاغ."
                : "Field technician companion — attendance, tasks, proof, report."}
            </p>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{ar ? "روابط" : "Links"}</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/55">
              <li>
                <Link to="/" className="hover:text-[#3FBF80]">
                  {ar ? "الرئيسية" : "Home"}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#3FBF80]">
                  {t("footerAbout")}
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-[#3FBF80]">
                  {ar ? "الأمان والامتثال" : "Security & Compliance"}
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#3FBF80]">
                  {ar ? "دخول المنصة" : "Enter platform"}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-lg text-white">{t("footerContactHeading")}</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-white/55">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-[#3FBF80]" />
                {ar ? "نيار عبدالله سويلم الرنياوي" : "Niyar Abdullah Sweilem Al-Raniawi"}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#3FBF80]" />
                <a href="tel:+966595414472" dir="ltr" className="hover:text-[#3FBF80]">
                  0595414472
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#3FBF80]" />
                <a href="mailto:niyar@powercares.pro" className="hover:text-[#3FBF80]">
                  niyar@powercares.pro
                </a>
              </li>
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
