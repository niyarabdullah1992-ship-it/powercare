import React from "react";
import { Link } from "react-router-dom";
import { Building2, Landmark, Users, LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { useI18n } from "@/lib/i18n";

const PORTALS = [
  {
    to: "/login/gov",
    Icon: Landmark,
    arTitle: "جهة حكومية",
    enTitle: "Government entity",
    arText: "دخول مخصص للدوائر والمقار الحكومية — مصطلحات ومسارات اعتماد منفصلة.",
    enText: "Dedicated access for government departments — separate terms and approval paths.",
    tone: "gov",
  },
  {
    to: "/login/company",
    Icon: Building2,
    arTitle: "شركة / مؤسسة",
    enTitle: "Company",
    arText: "دخول مخصص للشركات والمؤسسات — محطات وفرق ميدانية ومسير.",
    enText: "Dedicated access for companies — stations, field teams and payroll.",
    tone: "company",
  },
  {
    to: "/login/individual",
    Icon: Users,
    arTitle: "أفراد",
    enTitle: "Individual",
    arText: "مساحة شخصية مستقلة عن حساب الشركة أو الجهة.",
    enText: "A personal workspace separate from company or government accounts.",
    tone: "individual",
  },
];

/**
 * Login gateway — company and government are separate portals with dedicated credentials.
 */
export default function Login() {
  const { lang } = useI18n();
  const ar = lang === "ar";

  return (
    <AuthLayout
      icon={LogIn}
      title={ar ? "اختر بوابة الدخول" : "Choose your portal"}
      subtitle={ar ? "الشركة والجهة الحكومية منفصلتان — لكل حساب دخول مخصص" : "Company and government are separate — each account has its own login"}
      footer={
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <Link to="/workspace" className="font-medium text-accent hover:underline">
            {ar ? "ابحث عن مساحة شركتك" : "Find your company workspace"}
          </Link>
          <Link to="/pricing?org=company" className="font-medium text-accent hover:underline">
            {ar ? "إنشاء حساب شركة" : "Create company account"}
          </Link>
          <Link to="/pricing?org=gov" className="font-medium text-accent hover:underline">
            {ar ? "إنشاء حساب جهة حكومية" : "Create government account"}
          </Link>
          <Link to="/" className="font-medium text-accent hover:underline">
            {ar ? "الرئيسية" : "Home"}
          </Link>
        </span>
      }
    >
      <div className="space-y-3">
        {PORTALS.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className={`flex items-start gap-3 rounded-[12px] border px-4 py-4 transition hover:border-[#0E7A4B] ${
              p.tone === "gov"
                ? "border-[#0E7A4B]/35 bg-[#F1F7F3]"
                : p.tone === "company"
                  ? "border-[#0B1A3F]/25 bg-[#F7F8FA]"
                  : "border-[#E4E7EC] bg-white"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white ${
                p.tone === "gov" ? "bg-[#0E7A4B]" : "bg-[#0B1A3F]"
              }`}
            >
              <p.Icon className="h-5 w-5" strokeWidth={1.6} />
            </span>
            <span className="min-w-0 text-start">
              <span className="block text-[15px] font-semibold text-[#101828]">{ar ? p.arTitle : p.enTitle}</span>
              <span className="mt-1 block text-[12.5px] leading-relaxed text-[#667085]">{ar ? p.arText : p.enText}</span>
            </span>
          </Link>
        ))}
      </div>
    </AuthLayout>
  );
}
