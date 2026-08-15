import React, { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { getCompanyToken } from "@/lib/store";
import { isLocalPreviewActive, LOCAL_PREVIEW_COMPANY_ID } from "@/lib/localPreview";
import { localBudgetCall } from "@/lib/localExpensesFallback";
import { checkApproveClaimGate, checkMarkPaidGate } from "@/lib/expenseDerivations";
import { toast } from "@/components/ui/use-toast";
import { ACCENT, MUTED, NAVY, OK, WARN, BAD, NEUTRAL, bar, dot, ui, cardShell, tableShell, CARD } from "@/lib/platformStyles";

function isLocalWorkspace(companyId) {
  return isLocalPreviewActive() || companyId === LOCAL_PREVIEW_COMPANY_ID;
}

async function budgetApi(companyId, payload) {
  if (isLocalWorkspace(companyId)) return localBudgetCall(companyId, payload);
  try {
    const res = await base44.functions.invoke("budget", {
      ...payload,
      companyId,
      sessionToken: getCompanyToken(companyId),
    });
    const data = res?.data ?? res;
    if (data?.error) throw new Error(data.error);
    return data;
  } catch {
    return localBudgetCall(companyId, payload);
  }
}

const TAG_STYLE = {
  on_track: OK,
  watch: WARN,
  near_limit: BAD,
  over: BAD,
};

const STATUS_STYLE = {
  pending: WARN,
  approved: OK,
  rejected: BAD,
  paid: NEUTRAL,
};

const TAG_LABEL = {
  on_track: { ar: "ضمن الحد", en: "On track" },
  watch: { ar: "مراقبة", en: "Watch" },
  near_limit: { ar: "قارب النفاد", en: "Near limit" },
  over: { ar: "متجاوز", en: "Over" },
};

const STATUS_LABEL = {
  pending: { ar: "بانتظار الاعتماد", en: "Awaiting approval" },
  approved: { ar: "معتمدة", en: "Approved" },
  rejected: { ar: "مرفوضة", en: "Rejected" },
  paid: { ar: "مصروفة", en: "Paid" },
};

const fmt = (n) => Number(n || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

const claimsRow = {
  display: "grid",
  gridTemplateColumns: "minmax(220px,1.8fr) 130px 110px 110px 130px",
  gap: "12px",
  padding: "12px 18px",
  borderBottom: "1px solid #F1F5F9",
  alignItems: "center",
};

/** Platform expenses — budget bars + claims list (L1842+). */
export default function ExpenseBudgetBoard({ lang = "ar", stationScope = "all" }) {
  const ar = lang === "ar";
  const { company, currentUser } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [claims, setClaims] = useState([]);
  const [companySum, setCompanySum] = useState(null);
  const [alert, setAlert] = useState(null);
  const [busy, setBusy] = useState(false);
  const [hoverClaim, setHoverClaim] = useState(null);

  const visibleBudgets = stationScope === "all"
    ? budgets
    : budgets.filter((b) => String(b.stationId) === String(stationScope));
  const visibleClaims = stationScope === "all"
    ? claims
    : claims.filter((c) => String(c.stationId) === String(stationScope));

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.budgets)) setBudgets(remote.budgets);
    if (Array.isArray(remote?.claims)) setClaims(remote.claims);
    if (remote?.company) setCompanySum(remote.company);
    if (remote?.alert) setAlert(remote.alert);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await budgetApi(company.id, { action: "list" });
      applyRemote(remote);
    } catch {
      setBudgets([]);
      setClaims([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return;
    setBusy(true);
    try {
      const remote = await budgetApi(company.id, payload);
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
      } else {
        if (okMsg) toast({ description: okMsg });
        applyRemote(remote);
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const approve = async (claim) => {
    const budget = budgets.find((b) => b.stationId === claim.stationId);
    const gate = checkApproveClaimGate(claim, budget, claims);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run({ action: "approve", claimId: claim.id }, ar ? "اعتمدت المطالبة" : "Claim approved");
  };

  const markPaid = async (claim) => {
    const gate = checkMarkPaidGate(claim);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run({ action: "markPaid", claimId: claim.id }, ar ? "سُجّل الصرف" : "Marked paid");
  };

  if (!currentUser) return null;

  const barColor = (t) => {
    if (t === "near_limit" || t === "over") return "#DC2626";
    if (t === "watch") return "#F59E0B";
    return ACCENT;
  };

  const dotColor = (status) => {
    if (status === "rejected") return "#DC2626";
    if (status === "pending") return "#F59E0B";
    if (status === "approved") return ACCENT;
    return "#94A3B8";
  };

  return (
    <section dir={ar ? "rtl" : "ltr"} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1320px" }}>
      {/* Budget card — L1844 */}
      <div style={cardShell}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>
              {ar ? "استهلاك الميزانية التشغيلية" : "Operating budget consumption"}
            </div>
            <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>
              {ar
                ? "يُحدَّث لحظيًا مع كل مطالبة معتمدة · الإيصال مطلوب قبل الاعتماد"
                : "Updates live with every approved claim · receipt required before approval"}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span
              dir="ltr"
              style={{ fontFamily: "'IBM Plex Sans',sans-serif", fontSize: "26px", fontWeight: 600, lineHeight: 1, color: NAVY }}
            >
              {fmt(companySum?.spent)}
            </span>
            <span style={{ fontSize: "12px", color: MUTED }}>
              {ar ? `من ${fmt(companySum?.limit)} ر.س` : `of ${fmt(companySum?.limit)} SAR`}
            </span>
          </div>
        </div>

        {(alert?.delayedPayoutCount > 0 || alert?.pendingCount > 0) && (
          <p style={{ margin: "12px 0 0", fontSize: "11px", color: "#B45309" }}>
            {ar
              ? `${alert.delayedPayoutCount} معتمدة لم تُصرف خلال 48 ساعة · ${alert.pendingCount} بانتظار الاعتماد`
              : `${alert.delayedPayoutCount} approved unpaid after 48h · ${alert.pendingCount} awaiting approval`}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
          {visibleBudgets.map((b) => {
            const tagKey = b.tag || "on_track";
            const tagLbl = TAG_LABEL[tagKey] || TAG_LABEL.on_track;
            return (
              <div key={b.stationId} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "96px", fontSize: "12px", color: MUTED, flexShrink: 0 }}>
                  {b.stationName || b.stationId}
                </span>
                <span style={{ flex: 1, height: "8px", borderRadius: "5px", background: "#F1F5F9", overflow: "hidden" }}>
                  <span style={bar(Math.min(100, b.pct || 0), barColor(tagKey))} />
                </span>
                <span
                  dir="ltr"
                  style={{ width: "56px", textAlign: "right", fontSize: "12px", fontFamily: "'IBM Plex Sans',sans-serif", color: MUTED }}
                >
                  {b.pct}%
                </span>
                <span style={TAG_STYLE[tagKey] || OK}>{ar ? tagLbl.ar : tagLbl.en}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Claims table — L1867 */}
      <div style={tableShell}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", padding: "14px 18px", borderBottom: "1px solid #E2E8F0", flexWrap: "wrap" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: NAVY }}>{ar ? "المطالبات" : "Claims"}</div>
          <div style={{ fontSize: "11px", color: MUTED }}>
            {ar ? "المطالبة تحتاج إيصالًا مرفقًا قبل الاعتماد" : "A receipt attachment is required before approval"}
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: "820px" }}>
            {visibleClaims.length === 0 ? (
              <div style={{ padding: "26px 18px", textAlign: "center", fontSize: "13px", color: MUTED }}>
                {ar ? "لا مطالبات على اللوح بعد." : "No claims on the board yet."}
              </div>
            ) : (
              visibleClaims.map((c) => {
                const stKey = c.status || "pending";
                const stLbl = STATUS_LABEL[stKey] || STATUS_LABEL.pending;
                const station = budgets.find((b) => b.stationId === c.stationId);
                const statusNote = [
                  c.delayed ? (ar ? "متأخر" : "delayed") : "",
                  !c.hasReceipt && c.status === "pending" ? (ar ? "بلا إيصال" : "no receipt") : "",
                ].filter(Boolean).join(" · ");
                return (
                  <div
                    key={c.id}
                    style={{
                      ...claimsRow,
                      background: hoverClaim === c.id ? "#F7F8FA" : undefined,
                    }}
                    onMouseEnter={() => setHoverClaim(c.id)}
                    onMouseLeave={() => setHoverClaim(null)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                      <span style={dot(dotColor(stKey))} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "13px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: NAVY }}>
                          {c.title}
                        </div>
                        <div style={{ fontSize: "11px", color: MUTED, marginTop: "2px", fontFamily: "'IBM Plex Mono',monospace" }} dir="ltr">
                          {c.ref}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: MUTED, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.owner || "—"}
                    </div>
                    <div style={{ fontSize: "12px", color: MUTED }}>{station?.stationName || c.stationId}</div>
                    <div dir="ltr" style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'IBM Plex Sans',sans-serif", textAlign: "right", color: NAVY }}>
                      {fmt(c.amount)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-start" }}>
                      <span style={STATUS_STYLE[stKey] || WARN}>
                        {ar ? stLbl.ar : stLbl.en}
                        {statusNote ? ` · ${statusNote}` : ""}
                      </span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {c.status === "pending" && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => approve(c)}
                              style={{ ...ui.btnRow, padding: "4px 10px", fontSize: "10px", opacity: busy ? 0.5 : 1, display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              {busy ? <Loader2 style={{ width: 12, height: 12 }} /> : <Check style={{ width: 12, height: 12 }} />}
                              {ar ? "اعتماد" : "Approve"}
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => run(
                                { action: "reject", claimId: c.id, reason: c.hasReceipt ? "rejected" : "no receipt" },
                                ar ? "رُفضت المطالبة" : "Claim rejected",
                              )}
                              style={{
                                padding: "4px 10px",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                background: CARD,
                                color: MUTED,
                                fontSize: "10px",
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                opacity: busy ? 0.5 : 1,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <X style={{ width: 12, height: 12 }} />
                              {ar ? "رفض" : "Reject"}
                            </button>
                          </>
                        )}
                        {c.status === "approved" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => markPaid(c)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "8px",
                              border: "1px solid #E2E8F0",
                              background: CARD,
                              color: MUTED,
                              fontSize: "10px",
                              fontWeight: 500,
                              cursor: "pointer",
                              fontFamily: "inherit",
                              opacity: busy ? 0.5 : 1,
                            }}
                          >
                            {ar ? "سجّل الصرف" : "Mark paid"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
