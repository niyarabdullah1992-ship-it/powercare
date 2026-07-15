import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, KeyRound, Lock, Building2, ScrollText, FileCheck2, EyeOff, UserCog, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import SecurityFeatureCard from "@/components/security/SecurityFeatureCard";

// Public "Security & Compliance" page — describes the platform's real,
// implemented protections. Built for enterprise evaluations (e.g. ACWA Power).
export default function Security() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  const features = [
    {
      icon: KeyRound,
      title: ar ? "تحقق ثنائي إلزامي (OTP)" : "Mandatory Two-Factor Login (OTP)",
      text: ar
        ? "كل تسجيل دخول — للمالكين والموظفين — يتطلب رمز تحقق يُرسل للبريد وصالحًا لعشر دقائق فقط، مع حد أقصى للمحاولات."
        : "Every sign-in — owners and employees alike — requires an emailed one-time code valid for 10 minutes, with strict attempt limits.",
    },
    {
      icon: Lock,
      title: ar ? "تشفير كلمات المرور" : "Password Encryption",
      text: ar
        ? "كلمات المرور لا تُخزَّن أبدًا كنص. تُشفَّر بخوارزمية PBKDF2 مع 100,000 دورة وملح عشوائي لكل حساب."
        : "Passwords are never stored in plain text. They are hashed with PBKDF2 at 100,000 iterations with a unique random salt per account.",
    },
    {
      icon: Building2,
      title: ar ? "عزل كامل لبيانات كل شركة" : "Full Tenant Data Isolation",
      text: ar
        ? "بيانات كل شركة معزولة تمامًا على مستوى الخادم — لا يمكن لأي شركة الاطلاع على بيانات شركة أخرى تحت أي ظرف."
        : "Each company's data is fully isolated at the server level — no company can ever read another company's records.",
    },
    {
      icon: ScrollText,
      title: ar ? "سجل تدقيق شامل" : "Complete Audit Trail",
      text: ar
        ? "كل إجراء حساس (إنشاء حسابات، حذف موظفين، نقل ملكية) يُسجَّل تلقائيًا مع هوية المنفّذ والتوقيت."
        : "Every sensitive action (account creation, employee removal, ownership transfer) is automatically logged with actor and timestamp.",
    },
    {
      icon: FileCheck2,
      title: ar ? "توقيع رقمي موثّق" : "Verified Digital Signatures",
      text: ar
        ? "كل مستند موقَّع يُختم برقم تحقق فريد وبصمة SHA-256 تربط الختم بالملف النهائي بالضبط — أي تعديل يُكشف فورًا."
        : "Every signed document is stamped with a unique verification ID and a SHA-256 fingerprint bound to the exact final file — any tampering is instantly detectable.",
    },
    {
      icon: EyeOff,
      title: ar ? "بلاغات مجهولة محمية" : "Protected Anonymous Reporting",
      text: ar
        ? "قناة البلاغات المجهولة تستخدم تشفيرًا أحادي الاتجاه لهوية المُبلِّغ — لا يمكن لأحد، حتى إدارة المنصة، كشفها."
        : "The anonymous reporting channel uses one-way hashing of the reporter's identity — no one, not even platform administrators, can reveal it.",
    },
    {
      icon: UserCog,
      title: ar ? "صلاحيات حسب الدور" : "Role-Based Access Control",
      text: ar
        ? "كل موظف يرى فقط الأقسام والبيانات التي يحتاجها دوره، مع تحقق مزدوج من الصلاحيات على الخادم وليس المتصفح فقط."
        : "Each employee sees only the sections and data their role requires, with permissions enforced on the server — not just the browser.",
    },
    {
      icon: ShieldCheck,
      title: ar ? "جلسات آمنة محدودة المدة" : "Secure, Time-Limited Sessions",
      text: ar
        ? "جلسات الدخول تعتمد رموزًا عشوائية تنتهي تلقائيًا، وتُلغى فورًا عند حذف الحساب أو تسجيل الخروج."
        : "Sessions use random opaque tokens that expire automatically and are revoked instantly on logout or account removal.",
    },
  ];

  return (
    <div className="min-h-screen bg-landing-bg font-body text-primary">
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-landing-gold/15 bg-landing-bg/90 px-4 py-3 backdrop-blur-xl sm:px-6 md:px-10">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="font-heading text-lg font-semibold text-primary">PowerCare</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-sm font-body font-semibold text-landing-gold hover:underline">
          <ArrowLeft className={`h-4 w-4 ${ar ? "rotate-180" : ""}`} strokeWidth={1.75} />
          {ar ? "الرئيسية" : "Home"}
        </Link>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:px-10 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-landing-gold shadow-sm">
            <ShieldCheck className="h-8 w-8" strokeWidth={1.5} />
          </span>
          <h1 className="hero-title mt-6 text-4xl text-landing-gold sm:text-5xl md:text-6xl">
            {ar ? "الأمان والامتثال" : "Security & Compliance"}
          </h1>
          <p className="mt-5 text-base font-body leading-relaxed text-[#3a2f22]/65">
            {ar
              ? "الأمان ليس ميزة إضافية في PowerCare — إنه الأساس. كل طبقة من المنصة مبنية لحماية بيانات شركتك وموظفيك."
              : "Security isn't an add-on in PowerCare — it's the foundation. Every layer of the platform is built to protect your company and your people."}
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <SecurityFeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-landing-gold/20 bg-white p-8 text-center shadow-sm">
          <h2 className="font-heading text-2xl text-[#3a2f22]">
            {ar ? "جاهزون لأسئلة فريق الأمن لديكم" : "Ready for your security team's questions"}
          </h2>
          <p className="mt-2 text-sm font-body text-[#3a2f22]/60">
            {ar
              ? "تواصل معنا للحصول على تفاصيل تقنية إضافية أو عرض مباشر لآليات الحماية."
              : "Contact us for deeper technical details or a live walkthrough of our protection mechanisms."}
          </p>
          <p className="mt-4 text-sm font-body font-semibold text-landing-gold" dir="ltr">niyar@powercares.pro</p>
        </div>
      </div>
    </div>
  );
}