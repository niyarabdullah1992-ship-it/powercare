import React from "react";
import { Link } from "react-router-dom";
import { LogIn, Sparkles } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import { useI18n } from "@/lib/i18n";
import { isBase44BackendConfigured } from "@/lib/localPreview";

export default function Login() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const cloudReady = isBase44BackendConfigured();

  return (
    <AuthLayout
      icon={LogIn}
      title={ar ? "مرحباً بعودتك" : "Welcome back"}
      subtitle={ar ? "سجّل الدخول إلى NiroVera" : "Log in to NiroVera"}
      footer={
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>
            {ar ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link to="/register" className="font-medium text-accent hover:underline">
              {ar ? "إنشاء حساب" : "Create one"}
            </Link>
          </span>
          <Link to="/" className="font-medium text-accent hover:underline">
            {ar ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
          </Link>
        </span>
      }
    >
      <div className="space-y-4">
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
              ? "خادم Base44 غير موصول محليًا — استخدم المعاينة لتصفح اللوحة والأقسام كاملة ببيانات توضيحية."
              : "Base44 backend is not connected locally — use preview to browse the full dashboard with sample data."}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {ar ? "أو تسجيل الدخول" : "or sign in"}
          <span className="h-px flex-1 bg-border" />
        </div>
        <PowerCareLoginPanel />
      </div>
    </AuthLayout>
  );
}
