import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ShieldQuestion, Megaphone } from "lucide-react";
import AnonymousReports from "./AnonymousReports";
import PublicComplaints from "./PublicComplaints";

// Single combined section for both anonymous and identified (public) complaints —
// replaces the two separate nav entries with one tabbed page.
export default function Complaints() {
  const { t } = useI18n();
  const [tab, setTab] = useState("anonymous");

  const TABS = [
    { key: "anonymous", label: t("anonymous"), icon: ShieldQuestion },
    { key: "public", label: t("publicComplaints"), icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t("allComplaints")}</h1>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${tab === tb.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <tb.icon className="w-3.5 h-3.5" /> {tb.label}
          </button>
        ))}
      </div>

      {tab === "anonymous" ? <AnonymousReports /> : <PublicComplaints />}
    </div>
  );
}