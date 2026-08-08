import React, { useEffect, useState } from "react";
import { BadgeCheck, CalendarDays, Loader2, PenLine, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import ClientSignDialog from "@/components/workproof/ClientSignDialog";
import ProofCertificateDialog from "@/components/workproof/ProofCertificateDialog";
import { FileText } from "lucide-react";

// Public page opened by the client from the emailed signature link.
export default function WorkProofSign() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [signOpen, setSignOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("workProof", { action: "publicGet", token });
      setProof(res.data.proof);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [token]);

  const sign = async (payload) => {
    try {
      await base44.functions.invoke("workProof", { action: "publicSign", token, ...payload });
      setSignOpen(false);
      await load();
      return true;
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
      return false;
    }
  };

  return (
    <div className="powercare-public min-h-screen bg-background px-4 py-10" dir="rtl">
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="rounded-xl border border-accent/40 bg-primary p-6 text-primary-foreground">
          <p className="font-mono text-[11px] tracking-[0.2em] text-accent">POWERCARE · CLIENT WORK PROOF</p>
          <h1 className="mt-1 font-heading text-2xl font-semibold !text-primary-foreground">إثبات العمل — توقيع العميل</h1>
        </header>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
        ) : !proof ? (
          <p className="rounded-xl border border-border bg-card p-8 text-center text-sm font-body">
            {error === "Unauthorized" ? "هذا الرابط غير صالح أو تم توقيع الإثبات مسبقًا. يرجى طلب رابط جديد." : error || "الرابط غير صالح أو منتهي."}
          </p>
        ) : (
          <article className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-soft">
            <div>
              <p className="font-mono text-[11px] tracking-[0.2em] text-accent-text">{proof.proofNumber}</p>
              <h2 className="font-heading text-xl font-semibold">{proof.workTitle}</h2>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-body">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{proof.workDate}</span>
                <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" />{proof.performedByName}</span>
              </div>
            </div>

            {proof.workDescription && (
              <p className="border-s-2 border-accent/40 ps-3 text-sm leading-relaxed text-foreground/80 font-body">{proof.workDescription}</p>
            )}

            <div className="grid grid-cols-2 gap-2">
              {[["أيام مخططة", proof.plannedDays ?? "—"], ["أيام فعلية", proof.actualDays ?? "—"]].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body">{label}</p>
                  <p className="font-heading text-xl font-semibold leading-tight">{value}</p>
                </div>
              ))}
            </div>

            {[["صور قبل العمل", proof.beforeImageUrls], ["صور بعد العمل", proof.afterImageUrls]].map(([label, urls]) => (
              urls?.length ? (
                <div key={label} className="space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground font-body">{label}</p>
                  <div className="flex flex-wrap gap-2">
                    {urls.map((url) => (
                      <Image key={url} src={url} alt={label} className="h-24 w-24 rounded-md border border-border" />
                    ))}
                  </div>
                </div>
              ) : null
            ))}

            {proof.status === "signed" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm font-body">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  تم التوقيع بواسطة {proof.clientName} — {new Date(proof.signedAt).toLocaleString("ar")}
                </div>
                <button onClick={() => setCertOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-accent/50 bg-card px-4 py-3 text-sm font-semibold font-body">
                  <FileText className="h-4 w-4" />تحميل شهادة إثبات العمل (PDF)
                </button>
              </div>
            ) : (
              <button onClick={() => setSignOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground">
                <PenLine className="h-4 w-4" />مراجعة وتوقيع الإثبات
              </button>
            )}
            {error && <p className="text-xs text-destructive font-body">{error}</p>}
          </article>
        )}
      </div>

      {signOpen && <ClientSignDialog ar proofNumber={proof?.proofNumber} onClose={() => setSignOpen(false)} onSign={sign} />}
      {certOpen && proof && <ProofCertificateDialog proof={proof} stationName={proof.stationName || ""} companyName="" ar onClose={() => setCertOpen(false)} />}
    </div>
  );
}