import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function OwnerAccessCard({ t, lang }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 text-center py-4">
      <div className="w-12 h-12 rounded-full bg-landing-bg flex items-center justify-center mx-auto text-landing-gold">
        <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm text-[#3a2f22]/60 font-body max-w-xs mx-auto">
        {lang === "ar"
          ? "دخول المالك يتطلب تسجيل الدخول الآمن للمنصة."
          : "Owner access requires secure platform sign-in."}
      </p>
      <button
        onClick={() => { sessionStorage.setItem("owner_login_intent", "1"); navigate("/login"); }}
        className="w-full py-3 rounded-lg bg-gradient-to-b from-landing-gold-light to-landing-gold text-white font-body text-sm font-semibold hover:opacity-90 transition-opacity"
      >
        {t("login")}
      </button>
    </div>
  );
}