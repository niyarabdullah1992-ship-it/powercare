import React from "react";
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import PasswordResetForm from "@/components/landing/PasswordResetForm";
import { useI18n } from "@/lib/i18n";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const ar = lang === "ar";
  return (
    <AuthLayout
      icon={Mail}
      title={ar ? "استعادة كلمة المرور" : "Reset password"}
      subtitle={ar ? "سنرسل رمز تحقق إلى بريدك" : "We'll email you a verification code"}
    >
      <PasswordResetForm
        initialEmail=""
        onDone={() => navigate("/login", { replace: true })}
        onBack={() => navigate("/login")}
      />
    </AuthLayout>
  );
}