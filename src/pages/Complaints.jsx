import React, { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { ShieldQuestion, Megaphone, Archive } from "lucide-react";
import AnonymousReports from "./AnonymousReports";
import PublicComplaints from "./PublicComplaints";
import RecordSmartArchive from "@/components/RecordSmartArchive";

// Single combined section for both anonymous and identified (public) complaints —
// plus a smart archive (managers only) filing every complaint by Year → Month.
export default function Complaints() {
  const { t, lang, dir } = useI18n();
  const { data, currentUser } = useAuth();
  const [tab, setTab] = useState("anonymous");
  const ar = lang === "ar";

  const isManager = currentUser && (["director", "ops_manager", "pgm", "station_manager"].includes(currentUser.role) || currentUser.hrLevelId || data?.ownerId === currentUser.id);

  const TABS = [
    { key: "anonymous", label: t("anonymous"), icon: ShieldQuestion },
    { key: "public", label: t("publicComplaints"), icon: Megaphone },
    ...(isManager ? [{ key: "archive", label: ar ? "الأرشيف الذكي" : "Smart Archive", icon: Archive }] : []),
  ];

  const stationName = (id) => data?.stations?.find((s) => s.id === id)?.name || (ar ? "المقر" : "HQ");

  const archiveItems = isManager
    ? [
        ...(data?.anonymousReports || []).map((r) => ({
          id: "an_" + r.id, date: r.createdAt, title: stationName(r.stationId),
          text: r.message, badge: t("anonymous"),
        })),
        ...(data?.publicReports || []).map((r) => ({
          id: "pu_" + r.id, date: r.createdAt, title: stationName(r.stationId),
          text: r.message, badge: t("publicComplaints"),
        })),
      ]
    : [];

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

      {tab === "anonymous" && <AnonymousReports />}
      {tab === "public" && <PublicComplaints />}
      {tab === "archive" && isManager && (
        <RecordSmartArchive
          items={archiveItems}
          lang={lang}
          dir={dir}
          emptyLabel={ar ? "لا توجد شكاوى مؤرشفة — تُؤرشف كل شكوى تلقائيًا حسب شهرها." : "No archived complaints — each complaint is auto-filed by its month."}
        />
      )}
    </div>
  );
}