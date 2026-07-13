import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/dateFormat";
import { AlertTriangle } from "lucide-react";
import ComparisonExportButtons from "@/components/reports/ComparisonExportButtons";

// Lists free-text "stoppage issue" comments reported across task targets.
export default function IssuesList() {
  const { t, lang } = useI18n();
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const res = await base44.functions.invoke("supabaseTargets", {
          action: "listTargets",
          userRole: currentUser.role,
          userId: currentUser.id,
          stationId: currentUser.stationId || null,
          managedStations: currentUser.managedStations || [],
        });
        const targets = res?.data?.targets || [];
        const rows = [];
        for (const tg of targets) {
          for (const c of Array.isArray(tg.comments) ? tg.comments : []) {
            if (c.is_issue) rows.push({ ...c, taskTitle: tg.title || t("setTarget") });
          }
        }
        rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setIssues(rows);
      } catch {
        setIssues([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentUser?.id]);

  return (
    <div className="p-5 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h3 className="font-heading text-base font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {t("stoppageIssues")}
        </h3>
        <ComparisonExportButtons
          title={t("stoppageIssues")}
          headers={[t("employeeName"), t("title"), t("date"), t("description")]}
          rows={issues.map((c) => [c.user_name || "—", c.taskTitle, c.created_at ? formatDateTime(c.created_at, lang) : "—", c.content])}
        />
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : issues.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noIssuesReported")}</p>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {issues.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5 py-2 px-2.5 rounded-lg border-s-2 border-amber-400 bg-muted/40 hover:bg-muted/60 transition-colors">
              <div className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-[11px] font-medium shrink-0 mt-0.5">
                {(c.user_name || "?").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium font-body truncate">{c.user_name} <span className="text-muted-foreground font-normal">· {c.taskTitle}</span></p>
                  <span className="text-[10px] text-muted-foreground font-body whitespace-nowrap shrink-0">{c.created_at ? formatDateTime(c.created_at, lang) : ""}</span>
                </div>
                <p className="text-xs text-foreground/80 font-body mt-0.5 truncate">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}