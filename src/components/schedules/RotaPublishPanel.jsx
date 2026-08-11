import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import { isOnApprovedLeave } from "@/lib/leaveTypes";
import { checkPublishGates } from "@/lib/shiftDerivations";
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react";

async function workforce(payload) {
  const res = await base44.functions.invoke("workforce", payload);
  return res?.data ?? res;
}

export default function RotaPublishPanel({ stationId, year, monthIndex, shiftTypes, assignments, canManage }) {
  const { company, data } = useAuth();
  const { lang } = useI18n();
  const ar = lang === "ar";
  const [checks, setChecks] = useState(null);
  const [blocked, setBlocked] = useState(false);
  const [failed, setFailed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [source, setSource] = useState("local");

  const runLocal = () => {
    const namesById = {};
    const onLeaveIds = [];
    (data?.employees || []).forEach((e) => {
      namesById[e.id] = e.name;
      const days = new Date(year, monthIndex + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (isOnApprovedLeave(e, key)) {
          onLeaveIds.push(e.id);
          break;
        }
      }
    });
    return checkPublishGates({ year, monthIndex, shiftTypes, assignments, onLeaveIds, namesById });
  };

  const refresh = async () => {
    setMessage("");
    const local = runLocal();
    setChecks(local.checks);
    setBlocked(local.blocked);
    setFailed(local.failed);
    setSource("local");
    if (!company?.id || !stationId) return;
    try {
      const remote = await workforce({
        action: "checkPublish",
        companyId: company.id,
        stationId,
        year,
        monthIndex,
      });
      if (remote?.checks) {
        setChecks(remote.checks);
        setBlocked(!!remote.blocked);
        setFailed(remote.failed || null);
        setSource("server");
      }
    } catch {
      // Keep local derivation when the function is not yet deployed.
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId, year, monthIndex, JSON.stringify(shiftTypes), JSON.stringify(assignments)]);

  const publish = async () => {
    if (!canManage || !company?.id) return;
    setBusy(true);
    setMessage("");
    try {
      const remote = await workforce({
        action: "publish",
        companyId: company.id,
        stationId,
        year,
        monthIndex,
      });
      if (remote?.error === "PUBLISH_BLOCKED") {
        setBlocked(true);
        setFailed(remote.failed || null);
        setChecks(remote.checks || checks);
        setMessage(ar ? remote.reason : (remote.reasonEn || remote.reason));
      } else if (remote?.ok) {
        setBlocked(false);
        setFailed(null);
        setChecks(remote.checks || checks);
        setMessage(ar ? "نُشر الجدول وأُبلغ الفريق." : "Roster published and crew notified.");
      } else {
        setMessage(ar ? "تعذّر النشر." : "Publish failed.");
      }
    } catch (err) {
      const local = runLocal();
      if (local.blocked) {
        setBlocked(true);
        setFailed(local.failed);
        setMessage(ar ? `لا يمكن النشر — ${local.failed?.labelAr}` : `Cannot publish — ${local.failed?.labelEn}`);
      } else {
        setMessage(String(err?.message || err));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!checks) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
      <div>
        <h4 className="font-heading font-semibold text-sm">
          {ar ? "فحص ما قبل النشر" : "Pre-publication checks"}
        </h4>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {ar
            ? "كل فحص محسوب من المصفوفة — لا يُنشر جدول يخالف أيًّا منها."
            : "Every check is computed from the matrix — a roster that breaks any of them cannot be published."}
          <span className="ms-2 opacity-60">({source})</span>
        </p>
      </div>
      <ul className="space-y-2">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2 text-sm font-body">
            {c.ok ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            )}
            <span className={c.ok ? "text-foreground" : "text-destructive font-medium"}>
              {ar ? c.labelAr : c.labelEn}
            </span>
          </li>
        ))}
      </ul>
      {canManage && (
        <button
          type="button"
          disabled={busy || blocked}
          onClick={publish}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-body ${
            blocked
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-foreground text-background hover:bg-accent"
          }`}
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {blocked
            ? (ar ? `لا يمكن النشر — ${failed?.labelAr || ""}` : `Cannot publish — ${failed?.labelEn || ""}`)
            : (ar ? "انشر الجدول وأبلغ الفريق" : "Publish and notify the crew")}
        </button>
      )}
      {message && <p className="text-xs font-body text-muted-foreground">{message}</p>}
    </div>
  );
}
