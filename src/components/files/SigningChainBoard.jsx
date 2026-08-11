import React, { useEffect, useState } from "react";
import { Loader2, PenLine, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/PowerCareAuth";
import {
  SIGNING_SOURCES,
  checkRaiseGate,
  checkSendSignedGate,
  checkSignGate,
  checkVerifySealGate,
} from "@/lib/signingDerivations";
import { toast } from "@/components/ui/use-toast";

async function signingApi(payload) {
  const res = await base44.functions.invoke("signing", payload);
  return res?.data ?? res;
}

const SOURCE_LABEL = {
  workproof: { ar: "إثبات عمل / شهادة إنجاز", en: "Work proof / completion certificate" },
  payroll: { ar: "مسير رواتب معتمد", en: "Approved payroll run" },
  leave: { ar: "قرار إجازة", en: "Leave decision" },
  completion_cert: { ar: "شهادة إنجاز", en: "Completion certificate" },
};

export default function SigningChainBoard({ lang = "ar" }) {
  const ar = lang === "ar";
  const { company, data, currentUser } = useAuth();
  const [docs, setDocs] = useState([]);
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    source: "workproof",
    sourceRef: "",
    title: "",
    secondSignerId: "",
  });

  const applyRemote = (remote) => {
    if (Array.isArray(remote?.docs)) setDocs(remote.docs);
    if (remote?.stats) setStats(remote.stats);
  };

  const load = async () => {
    if (!company?.id) return;
    try {
      const remote = await signingApi({ action: "list", companyId: company.id });
      applyRemote(remote);
    } catch {
      setDocs([]);
    }
  };

  useEffect(() => { load(); }, [company?.id]);

  const run = async (payload, okMsg) => {
    if (!company?.id) return null;
    setBusy(true);
    try {
      const remote = await signingApi({ ...payload, companyId: company.id });
      if (remote?.error) {
        toast({
          description: ar ? (remote.reason || remote.error) : (remote.reasonEn || remote.reason || remote.error),
          variant: "destructive",
        });
        return remote;
      }
      if (okMsg) toast({ description: okMsg });
      applyRemote(remote);
      return remote;
    } catch (err) {
      toast({ description: String(err?.message || err), variant: "destructive" });
      return null;
    } finally {
      setBusy(false);
    }
  };

  const raise = async (e) => {
    e.preventDefault();
    const second = (data?.employees || []).find((x) => x.id === form.secondSignerId);
    const signers = [
      { sid: "me", name: currentUser?.name || "Me", userId: currentUser?.id },
      ...(second ? [{ sid: second.id, name: second.name, userId: second.id }] : []),
    ];
    const gate = checkRaiseGate({ ...form, signers });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      {
        action: "raise",
        source: form.source,
        sourceRef: form.sourceRef,
        title: form.title || SOURCE_LABEL[form.source]?.[ar ? "ar" : "en"],
        contentHash: form.sourceRef,
        signers,
      },
      ar ? "وُضع المستند في سلسلة التوقيع." : "Document placed on the signing chain.",
    );
    setForm((f) => ({ ...f, sourceRef: "", title: "" }));
  };

  const signDoc = async (doc) => {
    const gate = checkSignGate(doc, { userId: currentUser?.id, sid: "me" });
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "sign", docKey: doc.docKey, sid: gate.signer.sid, userId: currentUser?.id },
      ar ? "وُقّع المستند وخُتم بمعرّف تحقق." : "Document signed and sealed with a verification id.",
    );
  };

  const verify = async (doc, sid) => {
    const gate = checkVerifySealGate(doc, sid);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    const remote = await run({ action: "verify", docKey: doc.docKey, sid });
    if (remote?.verified) {
      toast({ description: ar ? `تحقق ناجح: ${remote.sealId}` : `Verified: ${remote.sealId}` });
    }
  };

  const send = async (doc) => {
    const gate = checkSendSignedGate(doc);
    if (!gate.ok) {
      toast({ description: ar ? gate.reason : gate.reasonEn, variant: "destructive" });
      return;
    }
    await run(
      { action: "send", docKey: doc.docKey },
      ar ? "أُرسلت النسخة الموقّعة (PDF مختوم)." : "Signed sealed copy sent.",
    );
  };

  if (!currentUser) return null;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2"><PenLine className="h-5 w-5 text-accent" /></span>
          <div>
            <h2 className="font-heading text-lg font-semibold">{ar ? "سلسلة التوقيع المشتقة" : "Derived signing chain"}</h2>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
              {ar
                ? "التوقيع نهاية سلسلة لا بدايتها. الختم PENDING حتى يوقّع الدور، ومعرّف التحقق يُشتق من المستند والموقّع — أي تعديل يكسر البصمة."
                : "Signing is the end of a chain, not its start. Seals stay PENDING until that turn signs; the verification id derives from document + signer — any later edit breaks the fingerprint."}
            </p>
          </div>
        </div>
        {stats && (
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{stats.awaiting} {ar ? "بانتظار" : "awaiting"}</span>
            <span>{stats.yourTurn} {ar ? "دورك" : "your turn"}</span>
            <span>{stats.completed} {ar ? "مكتمل" : "completed"}</span>
          </div>
        )}
      </div>

      <form onSubmit={raise} className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/40 p-3">
        <label className="grid gap-1 text-[11px]">
          <span>{ar ? "المصدر" : "Source"}</span>
          <select className="h-8 rounded-md border bg-background px-2 text-sm" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
            {SIGNING_SOURCES.map((s) => (
              <option key={s} value={s}>{ar ? SOURCE_LABEL[s].ar : SOURCE_LABEL[s].en}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px]">
          <span>{ar ? "مرجع المصدر" : "Source ref"}</span>
          <input required className="h-8 rounded-md border bg-background px-2 text-sm" value={form.sourceRef} onChange={(e) => setForm((f) => ({ ...f, sourceRef: e.target.value }))} placeholder="OPS-4821 / 2026-08" />
        </label>
        <label className="grid gap-1 text-[11px]">
          <span>{ar ? "العنوان" : "Title"}</span>
          <input className="h-8 rounded-md border bg-background px-2 text-sm" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </label>
        <label className="grid gap-1 text-[11px]">
          <span>{ar ? "موقّع ثانٍ (اختياري)" : "Second signer (optional)"}</span>
          <select className="h-8 rounded-md border bg-background px-2 text-sm" value={form.secondSignerId} onChange={(e) => setForm((f) => ({ ...f, secondSignerId: e.target.value }))}>
            <option value="">{ar ? "— أنت فقط —" : "— you only —"}</option>
            {(data?.employees || []).filter((e) => e.id !== currentUser.id).map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {ar ? "ارفع إلى التوقيع" : "Raise to signing"}
        </button>
      </form>

      {docs.length === 0 && (
        <p className="text-sm text-muted-foreground">{ar ? "لا مستندات في سلسلة التوقيع بعد." : "No documents on the signing chain yet."}</p>
      )}

      {docs.map((doc) => (
        <article key={doc.docKey} className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-heading text-base font-semibold">{doc.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {ar ? SOURCE_LABEL[doc.source]?.ar || doc.source : SOURCE_LABEL[doc.source]?.en || doc.source}
                {" · "}
                <span dir="ltr">{doc.sourceRef}</span>
              </p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
              doc.done ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : doc.yourTurn ? "border-amber-200 bg-amber-50 text-amber-900"
                  : "border-border bg-muted text-muted-foreground"
            }`}>
              {doc.done
                ? (ar ? "مكتمل" : "Completed")
                : doc.yourTurn
                  ? (ar ? "بانتظار توقيعك" : "Awaiting your signature")
                  : (ar ? `بانتظار ${doc.pending} موقّع` : `Awaiting ${doc.pending} signer(s)`)}
            </span>
          </div>

          <div className="space-y-2">
            {(doc.signers || []).map((s, i) => {
              const seal = s.seal || {};
              return (
                <div key={s.sid} className="rounded-lg border border-dashed p-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium">{i + 1}. {s.name}</span>
                    <span className="text-muted-foreground">{s.signedAt ? (ar ? "وقّع" : "Signed") : (ar ? "بانتظار الدور" : "Waiting")}</span>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${seal.pending ? "border-border text-muted-foreground" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`} dir="ltr">
                      {seal.id}
                    </span>
                  </div>
                  {!seal.pending && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                      <span dir="ltr">{ar ? "بصمة" : "Fingerprint"}: {seal.fingerprint}</span>
                      <button type="button" disabled={busy} className="inline-flex items-center gap-1 rounded border px-2 py-0.5" onClick={() => verify(doc, s.sid)}>
                        <ShieldCheck className="h-3 w-3" />
                        {ar ? "تحقق من الختم" : "Verify the seal"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {!doc.done && (
              <button
                type="button"
                disabled={busy}
                onClick={() => signDoc(doc)}
                className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                {doc.yourTurn || doc.headSid === "me"
                  ? (ar ? "وقّع الآن" : "Sign now")
                  : (ar ? `وقّع بالنيابة عن الدور الحالي` : "Sign current turn")}
              </button>
            )}
            {doc.done && (
              <button
                type="button"
                disabled={busy || !!doc.sentAt}
                onClick={() => send(doc)}
                className="rounded-md border px-3 py-2 text-xs font-semibold disabled:opacity-40"
              >
                {doc.sentAt
                  ? (ar ? "أُرسلت النسخة الموقّعة" : "Signed copy sent")
                  : (ar ? "أرسل النسخة الموقّعة" : "Send the signed copy")}
              </button>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}
