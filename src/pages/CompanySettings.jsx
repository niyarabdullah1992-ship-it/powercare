import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import OrgTypeSettings from "@/components/hr/OrgTypeSettings";
import CompanySettingsBoard from "@/components/hr/CompanySettingsBoard";
import PlatformColorThemeCard from "@/components/hr/PlatformColorThemeCard";
import BrandingSettingsCard from "@/components/reports/BrandingSettingsCard";
import GovDocExpiryPanel from "@/components/hr/GovDocExpiryPanel";
import PlatformStampShell from "@/components/shared/PlatformStampShell";
import { ChromeBox } from "@/components/shared/IdentityCard";
import { deriveAttachedGovDocAlerts } from "@/lib/complianceDerivations";
import { ACCENT, INK, MUTED, SURFACE } from "@/lib/platformStyles";

const TABS = [
  { value: "company", ar: "المنشأة", en: "Company" },
  { value: "look", ar: "الهوية", en: "Look" },
  { value: "place", ar: "الموقع", en: "Location" },
  { value: "docs", ar: "الوثائق", en: "Documents" },
];

/** Platform `settings` — company record, look, geofence, attached gov-file alerts. */
export default function CompanySettings() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { data, currentUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tool = TABS.some((tab) => tab.value === requested) ? requested : "company";
  const docCount = useMemo(() => deriveAttachedGovDocAlerts(data?.employees || []).length, [data?.employees]);

  if (!data || !currentUser) return null;

  const select = (value) => {
    setParams(value === "company" ? {} : { tab: value }, { replace: true });
  };

  return (
    <PlatformStampShell
      ar={ar}
      title={ar ? "إعدادات الشركة" : "Company settings"}
      hint={ar ? "بيانات المنشأة، الهوية، الموقع، وتنبيه الملفات الحكومية المرفقة. الصلاحيات تُمنح من الهيكل التنظيمي." : "Company record, look, location, and attached government-file alerts. Access is granted from org structure."}
      sections={TABS.map((tab) => ({
        value: tab.value,
        label: ar ? tab.ar : tab.en,
        count: tab.value === "docs" ? docCount : 0,
      }))}
      tool={tool}
      onTool={select}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {tool !== "docs" ? <GovDocExpiryPanel lang={lang} compact /> : null}

        {tool === "company" ? (
          <>
            <OrgTypeSettings lang={lang} />
            <CompanySettingsBoard lang={lang} parts="record" />
          </>
        ) : null}

        {tool === "look" ? (
          <>
            <BrandingSettingsCard lang={lang} />
            <PlatformColorThemeCard lang={lang} />
          </>
        ) : null}

        {tool === "place" ? <CompanySettingsBoard lang={lang} parts="geo" /> : null}

        {tool === "docs" ? (
          <>
            <GovDocExpiryPanel lang={lang} />
            <ChromeBox>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", color: ACCENT, fontWeight: 600 }}>
                {ar ? "وزارة الموارد البشرية والتنمية الاجتماعية" : "MHRSD"}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: INK }}>
                {ar ? "مركز امتثال الموارد البشرية" : "HR compliance centre"}
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: MUTED, lineHeight: 1.7, maxWidth: 660 }}>
                {ar
                  ? "نطاقات ورقم منشأة التأمينات يعيشان في الموارد البشرية. التنبيه هنا للمرفق الذي له تاريخ انتهاء فقط."
                  : "Nitaqat and the GOSI establishment number live under Human Resources. The alert here is only for an attached file that has an expiry date."}
              </p>
              <Link
                to="/app/hr"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  height: 34,
                  marginTop: 14,
                  padding: "0 14px",
                  borderRadius: 9,
                  border: "1px solid #E2E8F0",
                  background: SURFACE,
                  color: INK,
                  fontSize: 12,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                {ar ? "افتح مركز الامتثال" : "Open the compliance centre"}
              </Link>
            </ChromeBox>
          </>
        ) : null}
      </div>
    </PlatformStampShell>
  );
}
