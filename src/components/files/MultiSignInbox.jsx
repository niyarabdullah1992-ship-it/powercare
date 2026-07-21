import React, { useEffect, useState, useCallback } from "react";
import { Inbox, Loader2, PenLine, Download, RefreshCw, Trash2, ShieldCheck, CalendarClock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import SignersProgress from "@/components/files/SignersProgress";
import { getCompanyToken } from "@/lib/store";
import SigningAuditTrail from "@/components/files/SigningAuditTrail";

export default function MultiSignInbox({ currentUser, companyId, ar, refreshKey, onPendingChange }) {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("multiSign", { action: "list", companyId, sessionToken: getCompanyToken(companyId), userId: currentUser.id, email: (currentUser.email || "").toLowerCase() });
      const rows = res.data?.requests || [];
      setRequests(rows);
      onPendingChange?.(rows.filter((row) => row.myStatus === "pending").length);
    } catch { setRequests([]); onPendingChange?.(0); } finally { setLoading(false); }
  }, [companyId, currentUser.id, currentUser.email, onPendingChange]);
  useEffect(() => { load(); }, [load, refreshKey]);

  const remove = async (request) => {
    setDeletingId(request.id);
    try {
      await base44.functions.invoke("multiSign", { action: "delete", companyId, sessionToken: getCompanyToken(companyId), userId: currentUser.id, requestId: request.id });
      setRequests((rows) => rows.filter((row) => row.id !== request.id));
    } finally { setDeletingId(null); }
  };
  const stamp = (value) => value ? new Date(value).toLocaleString(ar ? "ar-SA" : "en-GB") : "—";

  if (requests === null) return <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ تحميل طلبات التوقيع…" : "Loading signature requests…"}</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><Inbox className="h-5 w-5 text-accent" />{ar ? "صندوق التوقيع" : "Signing inbox"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? "تابع حالة كل طرف والنسخة النهائية من مكان واحد." : "Track every party and final copy in one place."}</p></div><button onClick={load} disabled={loading} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
      {requests.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{ar ? "لا توجد طلبات توقيع حتى الآن." : "No signature requests yet."}</div> : <div className="grid gap-4 md:grid-cols-2">{requests.map((request) => {
        const signedTimes = request.signers.map((signer) => signer.signedAt).filter(Boolean).sort();
        return <article key={request.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{request.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{ar ? `أنشأه ${request.creatorName}` : `Created by ${request.creatorName}`}</p>{request.myStatus === "pending" && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">{ar ? "في انتظار توقيعك" : "Awaiting your signature"}</span>}</div>{request.status === "completed" && <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />}</div>
          <SignersProgress signers={request.signers} ar={ar} />
          {request.status === "rejected" && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{ar ? "رُفض المستند" : "Document rejected"}{request.rejectionReason ? ` — ${request.rejectionReason}` : ""}</p>}
          <div className="my-4 space-y-1.5 rounded-xl bg-muted/60 p-3 font-mono text-[10px] text-muted-foreground"><p className="flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5" />{ar ? "أُنشئ:" : "Created:"} {stamp(request.createdAt)}</p>{request.signers.map((signer) => <p key={signer.email} className="flex items-center justify-between gap-2"><span className="truncate">{signer.name}</span><span dir="ltr" className={signer.signedAt ? "text-emerald-700" : ""}>{signer.signedAt ? stamp(signer.signedAt) : (ar ? "بانتظار التوقيع" : "Awaiting signature")}</span></p>)}<p className="flex items-center gap-2 border-t border-border pt-1.5"><ShieldCheck className="h-3.5 w-3.5" />{ar ? "آخر توقيع:" : "Last signature:"} {stamp(signedTimes.at(-1))}</p></div>
          <SigningAuditTrail events={request.auditTrail} ar={ar} />
          <div className="mt-3 flex items-center gap-2">{request.myStatus === "pending" && request.myToken && request.status === "pending" && <a href={`/sign?token=${request.myToken}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground shadow-sm"><PenLine className="h-4 w-4" />{ar ? "وقّع الآن" : "Sign now"}</a>}{request.status === "completed" && <a href={request.docUrl} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm text-primary-foreground"><Download className="h-4 w-4" />{ar ? "النسخة النهائية" : "Final copy"}</a>}{request.isCreator && <ConfirmDeleteDialog title={ar ? "حذف طلب التوقيع؟" : "Delete signature request?"} description={ar ? `سيُحذف طلب "${request.fileName}" نهائيًا.` : `The request “${request.fileName}” will be permanently deleted.`} onConfirm={() => remove(request)} trigger={<button disabled={deletingId === request.id} className="rounded-lg border border-border p-2.5 text-destructive hover:bg-destructive/10">{deletingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>} />}</div>
        </article>;
      })}</div>}
    </section>
  );
}