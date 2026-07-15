import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { Plug } from "lucide-react";
import ErpExportCenter from "@/components/erp/ErpExportCenter";
import ApiWebhooksPanel from "@/components/erp/ApiWebhooksPanel";
import QuickBooksCard from "@/components/erp/QuickBooksCard";

export default function Integrations() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [tab, setTab] = useState("export");

  if (!["director", "ops_manager"].includes(currentUser?.role)) {
    return <p className="text-sm text-muted-foreground font-body py-10 text-center">{ar ? "هذا القسم متاح للإدارة العليا فقط." : "This section is available to executive management only."}</p>;
  }

  const TABS = [
    { id: "export", label: ar ? "تصدير ERP" : "ERP Export" },
    { id: "api", label: "API & Webhooks" },
    { id: "quickbooks", label: "QuickBooks" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
          <Plug className="w-5 h-5" strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-semibold">{ar ? "تكاملات ERP" : "ERP Integrations"}</h1>
          <p className="text-xs text-muted-foreground font-body">
            {ar ? "اربط PowerCare بأنظمتك: SAP، Oracle، Odoo، QuickBooks أو أي نظام عبر API" : "Connect PowerCare to your systems: SAP, Oracle, Odoo, QuickBooks or anything via API"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 bg-muted rounded-full p-1 w-fit max-w-full overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-body font-medium whitespace-nowrap transition-colors ${
              tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "export" && <ErpExportCenter company={company} data={data} ar={ar} />}
      {tab === "api" && <ApiWebhooksPanel company={company} ar={ar} />}
      {tab === "quickbooks" && <QuickBooksCard ar={ar} />}
    </div>
  );
}