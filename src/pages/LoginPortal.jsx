import React from "react";
import { Link, useParams } from "react-router-dom";
import { Building2, Landmark, Users, Sparkles } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import { useI18n } from "@/lib/i18n";
import { isBase44BackendConfigured } from "@/lib/localPreview";

const META = {
  gov: {
    Icon: Landmark,
    arTitle: "دخول الجهات الحكومية",
    enTitle: "Government login",
    arSub: "حساب الجهة الحكومية فقط — لا يفتح حسابات الشركات من هنا.",
    enSub: "Government accounts only — company workspaces cannot sign in here.",
    register: "/pricing?org=gov",
    registerAr: "إنشاء حساب جهة حكومية",
    registerEn: "Create government account",
  },
  company: {
    Icon: Building2,
    arTitle: "دخول الشركات",
    enTitle: "Company login",
    arSub: "حساب الشركة فقط — لا يفتح حسابات الجهات الحكومية من هنا.",
    enSub: "Company accounts only — government workspaces cannot sign in here.",
    register: "/pricing?org=company",
    registerAr: "إنشاء حساب شركة",
    registerEn: "Create company account",
  },
  individual: {
    Icon: Users,
    arTitle: "دخول الأفراد",
    enTitle: "Individual login",
    arSub: "المساحة الشخصية فقط.",
    enSub: "Personal workspace only.",
    register: "/pricing?org=individual",
    registerAr: "إنشاء حساب فردي",
    registerEn: "Create individual account",
  },
};

export default function LoginPortal() {
  const { portal } = useParams();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const kind = portal === "gov" || portal === "individual" ? portal : "company";
  const meta = META[kind];
  const cloudReady = isBase44BackendConfigured();
  const returnPath = `/login/${kind}`;

  return (
    <AuthLayout
      icon={meta.Icon}
      title={ar ? meta.arTitle : meta.enTitle}
      subtitle={ar ? meta.arSub : meta.enSub}
      footer={
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <Link to={meta.register} className="font-medium text-accent hover:underline">
            {ar ? meta.registerAr : meta.registerEn}
          </Link>
          <Link to="/login" className="font-medium text-accent hover:underline">
            {ar ? "تغيير بوابة الدخول" : "Change portal"}
          </Link>
          <Link to="/" className="font-medium text-accent hover:underline">
            {ar ? "الرئيسية" : "Home"}
          </Link>
        </span>
      }
    >
      <div className="space-y-4">
        <div
          className={`rounded-lg px-3 py-2 text-center text-[12px] font-medium ${
            kind === "gov" ? "bg-[#E8F3ED] text-[#0E7A4B]" : "bg-[#EEF2F8] text-[#0B1A3F]"
          }`}
        >
          {ar
            ? (kind === "gov" ? "بوابة حكومية · حسابات مفصولة عن الشركات" : kind === "individual" ? "بوابة أفراد" : "بوابة شركات · حسابات مفصولة عن الجهات الحكومية")
            : (kind === "gov" ? "Government portal · separated from companies" : kind === "individual" ? "Individual portal" : "Company portal · separated from government")}
        </div>
        <a
          href="/preview"
          className="flex w-full items-center justify-center gap-2 rounded-md border border-accent/40 bg-accent/10 py-2.5 text-xs font-semibold text-accent hover:bg-accent/15"
        >
          <Sparkles className="h-4 w-4" />
          {ar ? "معاينة الصفحات الداخلية الآن" : "Preview internal pages now"}
        </a>
        {!cloudReady && (
          <p className="text-center text-[11px] leading-5 text-muted-foreground">
            {ar
              ? "خادم Base44 غير موصول محليًا — استخدم المعاينة لتصفح اللوحة."
              : "Base44 backend is not connected locally — use preview to browse the dashboard."}
          </p>
        )}
        <PowerCareLoginPanel fixedKind={kind} returnPath={returnPath} />
      </div>
    </AuthLayout>
  );
}
