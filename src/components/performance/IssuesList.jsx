import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/PowerCareAuth";
import { base44 } from "@/api/base44Client";
import { formatDateTime } from "@/lib/dateFormat";
import { AlertTriangle } from "lucide-react";

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
      <h3 className="font-heading text-base font-semibold flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4" /> {t("stoppageIssues")}
      </h3>
      {loading ? (
        <p className="text-sm text-muted-foreground font-body">…</p>
      ) : issues.length === 0 ? (
        <p className="text-sm text-muted-foreground font-body">{t("noIssuesReported")}</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {issues.map((c) => (
            <div key={c.id} className="p-3 rounded-lg border border-red-200 bg-red-50/50">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium font-body">{c.taskTitle}</p>
                <span className="text-[10px] text-muted-foreground font-body">{c.created_at ? formatDateTime(c.created_at, lang) : ""}</span>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-0.5">{c.user_name}</p>
              <p className="text-sm text-foreground font-body mt-1 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}