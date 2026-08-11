import React, { useEffect, useState } from "react";
import { Camera, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import { useI18n } from "@/lib/i18n";
import PageHeader from "@/components/PageHeader";
import { deriveProofStage, checkApproveWorkProofGate } from "@/lib/workProofDerivations";
import { toast } from "@/components/ui/use-toast";

async function workproof(payload) {
  const res = await base44.functions.invoke("workproof", payload);
  return res?.data ?? res;
}

const STAGE_LABEL = {
  await: { ar: "بانتظار صورة البعد", en: "Awaiting after photo" },
  ready: { ar: "بانتظار اعتماد المشرف", en: "Awaiting approval" },
  sealed: { ar: "مختوم", en: "Sealed" },
  accepted: { ar: "مستلَم من العميل", en: "Client-accepted" },
  rejected: { ar: "مرفوض", en: "Rejected" },
};

export default function WorkProof() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [proofs, setProofs] = useState([]);
  const [counts, setCounts] = useState(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client: "",
    stationId: data?.stations?.[0]?.id || "",
    beforeStamp: "",
    afterStamp: "",
    geoVerdict: "in",
  });
  const [geoReason, setGeoReason] = useState("");

  const isManager = currentUser && ["owner", "director", "ops_manager", "station_manager", "pgm", "admin"].includes(currentUser.role)
    || data?.ownerId === currentUser?.id;

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await workproof({ action: "list", companyId: company.id });
      if (Array.isArray(remote?.proofs)) {
        setProofs(remote.proofs);
        setCounts(remote.counts);
      }
    } catch {
      setProofs([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const raise = async (e) => {
    e.preventDefault();
    if (!company?.id) return;
    setBusy(true);
    try {
      const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
      const remote = await workproof({
        action: "raise",
        companyId: company.id,
        ...form,
        beforeStamp: form.beforeStamp || now,
        afterStamp: form.afterStamp || now,
      });
      if (remote?.ok) {
        toast({ description: ar ? "رُفع الإثبات بانتظار اعتماد مشرف آخر." : "Proof raised — awaiting a different supervisor." });
        setForm((f) => ({ ...f, title: "", client: "", beforeStamp: "", afterStamp: "" }));
        load();
      } else {
        toast({ description: remote?.error || "Failed", variant: "destructive" });
      }
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const approve = async (proof) => {
    const gate = checkApproveWorkProofGate({
      proof,
      actorUserId: currentUser?.id,
      geoClearReason: geoReason,
    });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reason, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const remote = await workproof({
        action: "approve",
        companyId: company.id,
        id: proof.id,
        geoClearReason: geoReason || undefined,
      });
      if (remote?.error) {
        toast({ description: ar ? remote.reason : (remote.reasonEn || remote.reason || remote.error), variant: "destructive" });
      } else {
        toast({ description: ar ? `خُتم ${remote.proof?.sealId}` : `Sealed ${remote.proof?.sealId}` });
        setGeoReason("");
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const accept = async (proof) => {
    setBusy(true);
    try {
      const remote = await workproof({ action: "accept", companyId: company.id, id: proof.id });
      if (remote?.error) {
        toast({ description: ar ? remote.reason : (remote.reasonEn || remote.error), variant: "destructive" });
      } else {
        load();
      }
    } finally {
      setBusy(false);
    }
  };

  const visible = proofs.filter((p) => filter === "all" || (p.stage || deriveProofStage(p)) === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={ar ? "إثبات العمل" : "Work Proof"}
        description={ar
          ? "سلسلة من أربع مراحل: التقاط مختوم → اعتماد مشرف (ليس الرافع) → ختم → استلام العميل."
          : "Four-stage chain: stamped capture → supervisor approval (not the raiser) → seal → client acceptance."}
        icon={Camera}
      />

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["await", counts.await],
            ["ready", counts.ready],
            ["sealed", counts.sealed],
            ["accepted", counts.accepted],
            ["rejected", counts.rejected],
          ].map(([key, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? "all" : key)}
              className={`rounded-xl border p-3 text-start ${filter === key ? "border-accent bg-accent/5" : "border-border bg-card"}`}
            >
              <p className="font-heading text-xl font-semibold">{n}</p>
              <p className="text-[11px] text-muted-foreground">{ar ? STAGE_LABEL[key].ar : STAGE_LABEL[key].en}</p>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={raise} className="rounded-xl border border-border bg-card p-4 md:p-5 space-y-3">
        <h3 className="font-heading font-semibold text-sm">{ar ? "رفع إثبات عمل" : "Raise a work proof"}</h3>
        <p className="text-xs text-muted-foreground">{ar ? "من رفعه لا يعتمده." : "The raiser cannot approve it."}</p>
        <div className="grid md:grid-cols-2 gap-3">
          <input required value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder={ar ? "العميل" : "Client"} className="rounded-md border border-input px-3 py-2 text-sm" />
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={ar ? "وصف العمل" : "Work performed"} className="rounded-md border border-input px-3 py-2 text-sm" />
          <select value={form.stationId} onChange={(e) => setForm({ ...form, stationId: e.target.value })} className="rounded-md border border-input px-3 py-2 text-sm">
            {(data?.stations || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.geoVerdict} onChange={(e) => setForm({ ...form, geoVerdict: e.target.value })} className="rounded-md border border-input px-3 py-2 text-sm">
            <option value="in">{ar ? "داخل النطاق" : "Inside geofence"}</option>
            <option value="out">{ar ? "خارج النطاق" : "Outside geofence"}</option>
          </select>
        </div>
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm text-background">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {ar ? "ارفع للاعتماد" : "Submit for approval"}
        </button>
      </form>

      {isManager && (
        <div className="rounded-xl border border-border bg-card p-3">
          <label className="text-xs text-muted-foreground block mb-1">{ar ? "سبب قبول خارج النطاق (إن لزم)" : "Out-of-geofence acceptance reason (if needed)"}</label>
          <input value={geoReason} onChange={(e) => setGeoReason(e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" />
        </div>
      )}

      <div className="space-y-3">
        {visible.map((p) => {
          const stage = p.stage || deriveProofStage(p);
          const selfBlock = isManager && currentUser?.id && p.raiserId === currentUser.id && stage === "ready";
          return (
            <div key={p.id || p.ref} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-heading font-semibold text-sm">{p.title} — {p.client}</p>
                  <p className="text-xs text-muted-foreground font-body">{p.ref} · {p.beforeStamp} → {p.afterStamp || "—"} · {p.geoVerdict === "out" ? (ar ? "خارج النطاق" : "Outside") : (ar ? "داخل النطاق" : "Inside")}</p>
                </div>
                <span className="text-[10px] rounded-full border px-2 py-0.5">{ar ? STAGE_LABEL[stage]?.ar : STAGE_LABEL[stage]?.en}</span>
              </div>
              {p.sealId && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-700 font-body">
                  <ShieldCheck className="w-3.5 h-3.5" /> {p.sealId}
                </p>
              )}
              {selfBlock && (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {ar ? "لا يمكنك اعتماد إثبات رفعته أنت." : "You cannot approve a proof you raised."}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {isManager && stage === "ready" && !selfBlock && (
                  <button type="button" disabled={busy} onClick={() => approve(p)} className="rounded-md bg-foreground px-3 py-1.5 text-xs text-background">
                    {ar ? "اعتمد واختم" : "Approve & seal"}
                  </button>
                )}
                {stage === "sealed" && (
                  <button type="button" disabled={busy} onClick={() => accept(p)} className="rounded-md border px-3 py-1.5 text-xs">
                    {ar ? "استلام العميل" : "Client accept"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {!visible.length && <p className="text-sm text-muted-foreground text-center py-8">{ar ? "لا إثباتات بعد" : "No proofs yet"}</p>}
      </div>
    </div>
  );
}
