import React, { useEffect, useState, useCallback } from "react";
import { Inbox, Loader2, PenLine, Download, RefreshCw, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Lists group-signing requests: documents waiting for MY signature, plus
// requests I created with each signer's live status.
export default function MultiSignInbox({ currentUser, companyId, ar, refreshKey }) {
  const [requests, setRequests] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("multiSign", {
        action: "list",
        companyId,
        userId: currentUser.id,
        email: (currentUser.email || "").toLowerCase(),
      });
      setRequests(res.data?.requests || []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, currentUser.id, currentUser.email]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const [deletingId, setDeletingId] = useState(null);
  const remove = async (r) => {
    if (!window.confirm(ar ? `حذف طلب التوقيع "${r.fileName}"؟` : `Delete the signature request "${r.fileName}"?`)) return;
    setDeletingId(r.id);
    try {
      await base44.functions.invoke("multiSign", {
        action: "delete",
        companyId,
        userId: currentUser.id,
        requestId: r.id,
      });
      setRequests((rows) => rows.filter((x) => x.id !== r.id));
    } finally {
      setDeletingId(null);
    }
  };

  if (requests === null) {
    return (
      <div className="p-5 rounded-xl border border-border bg-card flex items-center gap-2 text-xs text-muted-foreground font-body">
        <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ تحميل طلبات التوقيع…" : "Loading signature requests…"}
      </div>
    );
  }
  if (requests.length === 0) return null;

  const toSign = requests.filter((r) => r.myStatus === "pending");
  const others = requests.filter((r) => r.myStatus !== "pending");

  const StatusChip = ({ s }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body border ${
      s.status === "signed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
    }`}>
      {s.status === "signed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {s.name}
    </span>
  );

  const Row = ({ r }) => (
    <div className="border border-border rounded-lg px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-xs font-medium font-body truncate">{r.fileName}</p>
        <div className="flex items-center gap-2 shrink-0">
          {r.myStatus === "pending" && r.myToken && (
            <a href={`/sign?token=${r.myToken}`} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-foreground text-background text-[11px] font-body">
              <PenLine className="w-3 h-3" /> {ar ? "وقّع الآن" : "Sign now"}
            </a>
          )}
          {r.status === "completed" && (
            <a href={r.docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-border text-[11px] font-body hover:bg-muted">
              <Download className="w-3 h-3" /> {ar ? "النسخة النهائية" : "Final copy"}
            </a>
          )}
          {r.isCreator && (
            <button
              onClick={() => remove(r)}
              disabled={deletingId === r.id}
              className="p-1.5 rounded-md border border-border text-destructive hover:bg-destructive/10 disabled:opacity-40"
              aria-label={ar ? "حذف الطلب" : "Delete request"}
            >
              {deletingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {r.signers.map((s, i) => <StatusChip key={i} s={s} />)}
      </div>
      <p className="text-[10px] text-muted-foreground font-body">
        {ar ? `أنشأه ${r.creatorName}` : `Created by ${r.creatorName}`} · {new Date(r.createdAt).toLocaleDateString(ar ? "ar" : "en-GB")}
      </p>
    </div>
  );

  return (
    <div className="p-5 rounded-xl border border-border bg-card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading text-base font-semibold flex items-center gap-2">
          <Inbox className="w-4 h-4 text-accent" /> {ar ? "طلبات التوقيع الجماعي" : "Group signature requests"}
        </h3>
        <button onClick={load} disabled={loading} className="p-1.5 rounded hover:bg-muted text-muted-foreground" aria-label="refresh">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {toSign.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-amber-700 font-body">{ar ? "بانتظار توقيعك" : "Awaiting your signature"}</p>
          {toSign.map((r) => <Row key={r.id} r={r} />)}
        </div>
      )}
      {others.length > 0 && (
        <div className="space-y-2">
          {toSign.length > 0 && <p className="text-[11px] font-medium text-muted-foreground font-body">{ar ? "طلبات أخرى" : "Other requests"}</p>}
          {others.map((r) => <Row key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}