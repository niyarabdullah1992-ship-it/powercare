import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/PowerCareAuth";
import { useOrgTerms } from "@/hooks/useOrgTerms";

/**
 * Display-only persona + facility kind. Org type is locked at signup / login portal —
 * not a switch between company and government.
 */
export default function DashboardPersonaBar({ lang = "ar" }) {
  const ar = lang === "ar";
  const { currentUser, data } = useAuth();
  const { orgType, terms, isGov } = useOrgTerms();

  const role = currentUser?.role || "employee";
  const persona = (() => {
    if (role === "employee") return "employee";
    if (["station_manager", "pgm"].includes(role)) return "manager";
    if (currentUser?.hrLevelId || role === "ops_manager") return "hr";
    if (["director", "owner"].includes(role) || currentUser?.id === data?.ownerId) return "executive";
    return "hr";
  })();

  const roles = [
    { id: "employee", ar: "موظف", en: "Employee" },
    { id: "manager", ar: "مدير مباشر", en: "Line manager" },
    { id: "hr", ar: "موارد بشرية", en: "HR" },
    { id: "executive", ar: "تنفيذي", en: "Executive" },
  ];

  const portalPath = isGov ? "/login/gov" : "/login/company";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {roles.map((r) => {
        const active = persona === r.id;
        return (
          <span
            key={r.id}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
              active
                ? "bg-[#0B1A3F] text-white"
                : "border border-[#E4E7EC] bg-white text-[#98A2B3]"
            }`}
          >
            {ar ? r.ar : r.en}
          </span>
        );
      })}

      <span className="mx-0.5 hidden h-4 w-px bg-[#E4E7EC] sm:inline" aria-hidden />

      <span
        className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ${
          isGov ? "bg-[#0E7A4B] text-white" : "bg-[#0B1A3F] text-white"
        }`}
        title={ar ? "نوع الجهة ثابت من بوابة التسجيل/الدخول" : "Facility type is fixed at signup/login"}
      >
        {isGov ? (ar ? "جهة حكومية" : "Government") : (ar ? "شركة" : terms.orgKindShort)}
      </span>

      <Link
        to={portalPath}
        className="rounded-full border border-[#E4E7EC] bg-white px-3 py-1.5 text-[11.5px] text-[#667085] hover:border-[#0E7A4B] hover:text-[#0E7A4B]"
      >
        {ar ? "بوابة الدخول المخصصة" : "Dedicated login portal"}
      </Link>
    </div>
  );
}
