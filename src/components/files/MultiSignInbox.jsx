import React, { useEffect, useState, useCallback } from "react";
import { Inbox, Loader2, PenLine, Download, RefreshCw, Trash2, ShieldCheck, CalendarClock } from "lucide-react";

const statusBorder = (status) => status === "completed" ? "border-s-emerald-600" : status === "rejected" ? "border-s-destructive" : "border-s-amber-500";
import { base44 } from "@/api/base44Client";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import SignersProgress from "@/components/files/SignersProgress";
import { getCompanyToken } from "@/lib/store";
import SigningAuditTrail from "@/components/files/SigningAuditTrail";
import { toast } from "@/components/ui/use-toast";
import SignerReminderMenu from "@/components/files/SignerReminderMenu";

export default function MultiSignInbox({ currentUser, companyId, ar, refreshKey, onPendingChange }) {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [remindingKey, setRemindingKey] = useState("");
  const [remindedKey, setRemindedKey] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
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
  const remind = async (request, signer) => {
    const key = `${request.id}:${signer.email}`;
    setRemindingKey(key);
    try {
      await base44.functions.invoke("multiSign", { action: "remind", companyId, sessionToken: getCompanyToken(companyId), userId: currentUser.id, requestId: request.id, signerEmail: signer.email, lang: ar ? "ar" : "en" });
      setRemindedKey(key);
      setTimeout(() => setRemindedKey(""), 2500);
    } catch (error) {
      toast({ description: error?.response?.data?.error || (ar ? "تعذّر إرسال التذكير." : "Couldn't send the reminder."), variant: "destructive" });
    } finally { setRemindingKey(""); }
  };
  const downloadRejected = async (request) => {
    setDownloadingId(request.id);
    try {
      const blob = await fetch(request.docUrl).then((response) => response.blob());
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = request.fileName; document.body.appendChild(link); link.click(); link.remove();
      URL.revokeObjectURL(url);
    } catch { window.open(request.docUrl, "_blank"); }
    finally { setDownloadingId(null); }
  };
  const stamp = (value) => value ? new Date(value).toLocaleString(ar ? "ar-SA" : "en-GB") : "—";

  if (requests === null) return <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{ar ? "جارٍ تحميل طلبات التوقيع…" : "Loading signature requests…"}</div>;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between"><div><h2 className="flex items-center gap-2 font-heading text-xl font-semibold"><Inbox className="h-5 w-5 text-accent" />{ar ? "صندوق التوقيع" : "Signing inbox"}</h2><p className="mt-1 text-xs text-muted-foreground">{ar ? "تابع حالة كل طرف والنسخة النهائية من مكان واحد." : "Track every party and final copy in one place."}</p></div><button onClick={load} disabled={loading} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div>
      {requests.length === 0 ? <div className="rounded-2xl border border-dashed border-accent/30 bg-card p-12 text-center text-sm text-muted-foreground">{ar ? "لا توجد طلبات توقيع حتى الآن." : "No signature requests yet."}</div> : <div className="grid gap-4">{requests.map((request) => {
        return <article key={request.id} className={`rounded-2xl border border-s-4 border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:p-7 ${statusBorder(request.status)}`}>
          <div className="mb-4 flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-heading text-xl font-semibold sm:text-2xl">{request.fileName}</p><p className="mt-1 text-xs text-muted-foreground">{ar ? `أنشأه ${request.creatorName}` : `Created by ${request.creatorName}`}</p>{request.myStatus === "pending" && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">{ar ? "في انتظار توقيعك" : "Awaiting your signature"}</span>}</div>{request.status === "completed" && <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />}</div>
          <SignersProgress signers={request.signers} ar={ar} />
          {request.isCreator && request.status === "pending" && <SignerReminderMenu requestId={request.id} signers={request.signers} ar={ar} busyKey={remindingKey} sentKey={remindedKey} onRemind={(signer) => remind(request, signer)} />}
          {request.status === "rejected" && <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{ar ? "رُفض المستند" : "Document rejected"}{request.rejectionReason ? ` — ${request.rejectionReason}` : ""}</p>}
          <p className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5 text-accent" />{ar ? "تاريخ الإنشاء:" : "Created:"} {stamp(request.createdAt)}</p>
          <SigningAuditTrail events={request.auditTrail} ar={ar} />
          <div className="mt-3 flex items-center gap-2">{request.myStatus === "pending" && request.myToken && request.status === "pending" && <a href={`/sign?token=${request.myToken}`} className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-[15px] font-bold text-accent-foreground shadow-lg"><PenLine className="h-4 w-4" />{ar ? "وقّع الآن" : "Sign now"}</a>}{request.status === "completed" && <a href={request.docUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-[15px] font-bold text-primary-foreground shadow-md"><Download className="h-4 w-4" />{ar ? "النسخة النهائية" : "Final copy"}</a>}{request.status === "rejected" && <button onClick={() => downloadRejected(request)} disabled={downloadingId === request.id} className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-[15px] font-bold text-foreground shadow-sm hover:bg-muted disabled:opacity-50">{downloadingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{ar ? "تنزيل الملف" : "Download file"}</button>}{request.isCreator && <ConfirmDeleteDialog title={ar ? "حذف طلب التوقيع؟" : "Delete signature request?"} description={ar ? `سيُحذف طلب "${request.fileName}" نهائيًا.` : `The request “${request.fileName}” will be permanently deleted.`} onConfirm={() => remove(request)} trigger={<button disabled={deletingId === request.id} className="rounded-lg border border-border p-2.5 text-destructive hover:bg-destructive/10">{deletingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>} />}</div>
        </article>;
      })}</div>}
    </section>
  );
}