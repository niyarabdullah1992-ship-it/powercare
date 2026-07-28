import React from "react";
import { ChevronDown, FileSpreadsheet, FileText } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { exportExcelColored } from "@/lib/exportExcelColored";
import { printReport } from "@/lib/printReport";
import { canUsePlanFeature } from "@/lib/navVisibility";
import PlanFeatureNotice from "@/components/subscription/PlanFeatureNotice";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PerformanceReportButton({ title, headers, rows, stats = [] }) {
  const { dir, lang } = useI18n();
  const { data, company } = useAuth();
  const branding = data?.reportBranding || {};
  const disabled = !Array.isArray(rows) || rows.length === 0;
  if (!canUsePlanFeature(company, "exports")) return <PlanFeatureNotice />;
  const excel = () => exportExcelColored({ filename: title.replace(/\s+/g, "_"), title, headers, rows, color: branding.color || "#b07d3f", dir });
  const pdf = () => printReport({ title, companyName: company?.name || "", periodLabel: new Date().toLocaleDateString(), dir, stats, sections: [{ heading: title, headers, rows }], logoUrl: branding.logoUrl || "", color: branding.color || "#b07d3f", theme: "executiveGold" });
  return <DropdownMenu><DropdownMenuTrigger asChild><button disabled={disabled} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-body text-foreground shadow-sm hover:border-accent/60 hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-40"><FileText className="h-3.5 w-3.5 text-accent" /><span>{lang === "ar" ? "تقرير الأداء (PDF / Excel)" : "Performance report (PDF / Excel)"}</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></button></DropdownMenuTrigger><DropdownMenuContent align={dir === "rtl" ? "start" : "end"} className="min-w-52"><DropdownMenuItem onClick={pdf} className="gap-2"><FileText className="h-4 w-4 text-accent" />{lang === "ar" ? "تصدير PDF" : "Export PDF"}</DropdownMenuItem><DropdownMenuItem onClick={excel} className="gap-2"><FileSpreadsheet className="h-4 w-4 text-emerald-600" />{lang === "ar" ? "تصدير Excel" : "Export Excel"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}