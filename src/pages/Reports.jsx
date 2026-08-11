import React from "react";
import { BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import PageHeader from "@/components/PageHeader";
import ReportLibraryBoard from "@/components/reports/ReportLibraryBoard";

/** One-job surface: report library & analytics (Platform `reports`) — separate from daily station filing. */
export default function Reports() {
  const { lang } = useI18n();
  const { data, currentUser } = useAuth();
  if (!data || !currentUser) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lang === "ar" ? "التقارير والتحليلات" : "Reports & Analytics"}
        description={
          lang === "ar"
            ? "مكتبة التقارير والجدولة التلقائية"
            : "Report library and automated scheduling"
        }
        icon={BarChart3}
      />
      <ReportLibraryBoard lang={lang} />
    </div>
  );
}
