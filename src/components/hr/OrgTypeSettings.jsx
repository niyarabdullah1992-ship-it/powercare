import React from "react";
import { Building2, Landmark, Lock } from "lucide-react";
import { useOrgTerms } from "@/hooks/useOrgTerms";
import { ORG_TYPES } from "@/lib/orgTerms";
import { Link } from "react-router-dom";

/**
 * Org type is locked at account creation / dedicated login portal — display only.
 */
export default function OrgTypeSettings({ lang = "ar" }) {
  const ar = lang === "ar";
  const { orgType, terms, isGov } = useOrgTerms();

  const options = [
    {
      id: ORG_TYPES.COMPANY,
      Icon: Building2,
      title: ar ? "شركة / مؤسسة" : "Company / enterprise",
      portal: "/login/company",
    },
    {
      id: ORG_TYPES.GOV,
      Icon: Landmark,
      title: ar ? "جهة حكومية" : "Government entity",
      portal: "/login/gov",
    },
  ];

  return (
    <section className="rounded-[10px] border border-[#E4E7EC] bg-white p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F2F4F7] text-[#667085]">
          <Lock className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[#0E7A4B]">
            {ar ? "نوع الجهة" : "ORGANIZATION TYPE"}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[#0B1A3F]">
            {ar ? "حساب مفصول حسب بوابة الدخول" : "Separated by login portal"}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#667085]">
            {ar
              ? `هذه المنشأة مسجّلة كـ «${terms.orgKind}». لا يمكن التحويل بين شركة وجهة حكومية من داخل اللوحة — لكل نوع تسجيل دخول وحساب مستقل.`
              : `This facility is registered as «${terms.orgKind}». Company and government cannot be switched here — each kind has its own login and account.`}
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const active = orgType === opt.id;
          return (
            <div
              key={opt.id}
              className={`flex flex-col gap-2 rounded-[10px] border px-4 py-4 ${
                active
                  ? isGov
                    ? "border-[#0E7A4B] bg-[#F1F7F3] ring-1 ring-[#0E7A4B]/35"
                    : "border-[#0B1A3F] bg-[#EEF2F8] ring-1 ring-[#0B1A3F]/25"
                  : "border-[#E4E7EC] bg-[#F9FAFB] opacity-55"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${active && isGov ? "bg-[#0E7A4B]" : "bg-[#0B1A3F]"}`}>
                <opt.Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="text-[14px] font-semibold text-[#101828]">{opt.title}</span>
              <span className="text-[12px] text-[#667085]">
                {active
                  ? (ar ? "هذا حسابك الحالي" : "Your current account")
                  : (ar ? "بوابة منفصلة — حساب آخر" : "Separate portal — different account")}
              </span>
              {!active && (
                <Link to={opt.portal} className="mt-1 text-[12.5px] font-medium text-[#0E7A4B] hover:underline">
                  {ar ? "الدخول من بوابتها" : "Sign in via that portal"}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
