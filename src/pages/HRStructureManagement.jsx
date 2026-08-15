import React from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import HrDirectoryBoard from "@/components/hr/HrDirectoryBoard";
import ComplianceMhrsdBoard from "@/components/hr/ComplianceMhrsdBoard";
import useStationScope from "@/hooks/useStationScope";
import PlatformStampShell from "@/components/shared/PlatformStampShell";

/**
 * Platform `hr` — directory table, onboarding pipeline, and the single
 * canonical home of the MHRSD compliance centre (Settings links here).
 * Grades and positions are created on /app/org.
 */
export default function HRStructureManagement() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  const stationScope = useStationScope();
  if (!data || !currentUser) return null;

  return (
    <PlatformStampShell
      ar={lang === "ar"}
      title={lang === "ar" ? "الموارد البشرية" : "Human resources"}
      hint={lang === "ar" ? "الدليل الوظيفي ومركز امتثال وزارة الموارد البشرية. المناصب والدرجات من الهيكل." : "Directory and the MHRSD compliance centre. Positions and grades live on org structure."}
      maxWidth={1280}
    >
      <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link to="/app/org" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "مناصب الهيكل" : "Org seats"}
        </Link>
        <Link to="/app/org?tab=assign" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "تعيين" : "Assign"}
        </Link>
        <Link to="/app/org?tab=tree" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "الشجرة" : "Tree"}
        </Link>
        <Link to="/app/hiring" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "التوظيف" : "Recruitment"}
        </Link>
        <Link to="/app/settings" className="nv-btn-ghost inline-flex h-[34px] items-center px-3.5">
          {lang === "ar" ? "إعدادات الشركة" : "Company settings"}
        </Link>
      </div>

      <HrDirectoryBoard lang={lang} stationScope={stationScope} />

      <ComplianceMhrsdBoard />
      </div>
    </PlatformStampShell>
  );
}
