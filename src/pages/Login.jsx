import React from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PowerCareLoginPanel from "@/components/auth/PowerCareLoginPanel";
import { useI18n } from "@/lib/i18n";

export default function Login() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <AuthLayout
      icon={LogIn}
      title={ar ? "مرحباً بعودتك" : "Welcome back"}
      subtitle={ar ? "سجّل الدخول إلى PowerCare" : "Log in to PowerCare"}
      footer={
        <span className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span>
            {ar ? "ليس لديك حساب؟ " : "Don't have an account? "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              {ar ? "إنشاء حساب" : "Create one"}
            </Link>
          </span>
          <Link to="/" className="font-medium text-primary hover:underline">
            {ar ? "العودة إلى الصفحة الرئيسية" : "Back to home"}
          </Link>
        </span>
      }
    >
      <PowerCareLoginPanel />
    </AuthLayout>
  );
}