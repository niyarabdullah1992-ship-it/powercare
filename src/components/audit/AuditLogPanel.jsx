import React, { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { fetchAuditLog } from "@/lib/auditLog";
import { useI18n } from "@/lib/i18n";

// Read-only list of sensitive-action audit entries for a single company.
export default function AuditLogPanel({ companyId }) {
  const { lang } = useI18n();
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    let ignore = false;
    fetchAuditLog(companyId).then((l) => { if (!ignore) setLogs(l); });
    return () => { ignore = true; };
  }, [companyId]);

  if (!logs) return null;

  return (
    <div className="p-4 rounded-xl border border-border bg-card space-y-3">
      <h3 className="font-heading font-semibold flex items-center gap-2 text-sm">
        <ShieldAlert className="w-4 h-4 text-accent" />
        {lang === "ar" ? "سجل التدقيق" : "Audit Log"}
      </h3>
      {logs.length === 0 ? (
        <p className="text-xs text-muted-foreground font-body">
          {lang === "ar" ? "لا توجد عمليات حساسة مسجلة بعد." : "No sensitive actions logged yet."}
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((l) => (
            <div key={l.id} className="text-xs font-body p-2 rounded-md bg-muted/50">
              <p className="text-foreground">{l.details || l.action}</p>
              <p className="text-muted-foreground mt-0.5">
                {l.performedBy} · {new Date(l.created_date).toLocaleString(lang === "ar" ? "ar" : "en")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}