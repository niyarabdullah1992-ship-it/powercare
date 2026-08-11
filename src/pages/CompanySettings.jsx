import React from "react";
import { Settings2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PageHeader from "@/components/PageHeader";
import OrgTypeSettings from "@/components/hr/OrgTypeSettings";
import CompanySettingsBoard from "@/components/hr/CompanySettingsBoard";

/** One-job surface: company record, geofence, permission matrix (Platform `settings`). */
export default function CompanySettings() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === "ar" ? "إعدادات الشركة" : "Company Settings"}
        description={
          lang === "ar"
            ? "الحساب والنطاق الجغرافي والصلاحيات"
            : "Account, geofences and permissions"
        }
        icon={Settings2}
      />
      <OrgTypeSettings lang={lang} />
      <CompanySettingsBoard lang={lang} />
    </div>
  );
}
