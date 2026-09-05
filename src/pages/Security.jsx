import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { ShieldCheck, KeyRound, Lock, Building2, ScrollText, FileCheck2, EyeOff, UserCog, ArrowLeft } from "lucide-react";
import IdentityCard from "@/components/shared/IdentityCard";
import PublicPaperShell from "@/components/shared/PublicPaperShell";
import SecurityFeatureCard from "@/components/security/SecurityFeatureCard";
import { NAVY, ui } from "@/lib/platformStyles";

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
    <PublicPaperShell dir={ar ? "rtl" : "ltr"} maxWidth={1100}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Link to="/" style={{ ...ui.btnGhost, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <ArrowLeft style={{ width: 14, height: 14, transform: ar ? "rotate(180deg)" : undefined }} />
          {ar ? "الرئيسية" : "Home"}
        </Link>
      </div>
      <IdentityCard
        icon={ShieldCheck}
        kicker={ar ? "ثقة" : "Trust"}
        title={ar ? "الأمان والامتثال" : "Security & Compliance"}
        subtitle={ar
          ? "الأمان ليس ميزة إضافية في NiroVera — إنه الأساس. كل طبقة من المنصة مبنية لحماية بيانات شركتك وموظفيك."
          : "Security isn't an add-on in NiroVera — it's the foundation. Every layer of the platform is built to protect your company and your people."}
        dir={ar ? "rtl" : "ltr"}
      />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {features.map((f) => (
          <SecurityFeatureCard key={f.title} {...f} dir={ar ? "rtl" : "ltr"} />
        ))}
      </div>
      <IdentityCard
        title={ar ? "جاهزون لأسئلة فريق الأمن لديكم" : "Ready for your security team's questions"}
        subtitle={ar
          ? "تواصل معنا للحصول على تفاصيل تقنية إضافية أو عرض مباشر لآليات الحماية."
          : "Contact us for deeper technical details or a live walkthrough of our protection mechanisms."}
        dir={ar ? "rtl" : "ltr"}
      >
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: NAVY }} dir="ltr">niyar@powercares.pro</p>
      </IdentityCard>
    </PublicPaperShell>
  );
}
