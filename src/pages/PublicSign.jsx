import React, { useEffect, useState } from "react";
import { PenLine, Loader2, FileText, ShieldCheck, Download, ExternalLink, CheckCircle2, Keyboard, MousePointerClick } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignaturePad from "@/components/files/SignaturePad";
import SignSpotPicker from "@/components/files/SignSpotPicker";
import TypedSignature from "@/components/files/TypedSignature";
import PublicSignShell from "@/components/files/PublicSignShell";
import PublicSignSteps from "@/components/files/PublicSignSteps";
import { makeSignatureStamp, stampOnPdf } from "@/lib/multiSignStamp";
import { loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";

// Public signing page: opened from a personal signing link (email or in-app).
// Works for company members AND external people — no login required.
export default function PublicSign() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const ar = (navigator.language || "").startsWith("ar");
  const [info, setInfo] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [signing, setSigning] = useState(false);
  const [stage, setStage] = useState("");
  const [done, setDone] = useState(null); // { completed, docUrl }
  const [error, setError] = useState("");
  const [mode, setMode] = useState("type"); // "type" | "draw"
  const [sigSize, setSigSize] = useState(100); // signature size, % (50–200)
  const [chosenSpot, setChosenSpot] = useState(null); // signer-chosen placement {page,x,y}
  const [showSpotPicker, setShowSpotPicker] = useState(false);

  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!token) { setNotFound(true); return; }
    base44.functions.invoke("multiSign", { action: "getByToken", token })
      .then((res) => {
        setInfo(res.data);
        // Honor the size the creator picked for this signer's spot (pinch/slider).
        if (res.data?.signer?.spot?.scale) setSigSize(res.data.signer.spot.scale);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status !== 404) {
          // A network / server problem — not a bad link. Say so instead of
          // blaming the link.
          setLoadError(err?.response?.data?.error || err.message || "");
        }
        setNotFound(true);
      });
  }, [token]);

  const sign = async (sigDataUrl) => {
    setError("");
    setSigning(true);
    try {
      // Re-fetch the freshest version right before stamping — other signers may
      // have signed in the meantime (parallel signing).
      setStage(ar ? "جارٍ تجهيز أحدث نسخة…" : "Fetching the latest version…");
      const fresh = (await base44.functions.invoke("multiSign", { action: "getByToken", token })).data;
      if (fresh.expiresAt && new Date(fresh.expiresAt).getTime() <= Date.now()) throw new Error(ar ? "انتهت صلاحية طلب التوقيع." : "This signature request has expired.");
      if (fresh.signer.status === "signed") throw new Error(ar ? "وقّعت هذا المستند مسبقًا." : "You already signed this document.");
      if (!fresh.canSign) throw new Error(ar ? "يجب اكتمال توقيع الطرف السابق أولًا." : "The previous signer must finish first.");

      setStage(ar ? "جارٍ ختم توقيعك على المستند…" : "Stamping your signature…");
      const stamp = await makeSignatureStamp(sigDataUrl, fresh.signer.name, fresh.verificationId);
      let badge = null;
      if (fresh.isLast && fresh.verificationId) {
        const qr = await loadBadgeQr(fresh.verificationId).catch(() => null);
        badge = { sigId: fresh.verificationId, name: fresh.signerNames.slice(0, 60), qr };
      }
      const { url, bytes } = await stampOnPdf(fresh.docUrl, stamp, fresh.signedCount, badge, chosenSpot || fresh.signer.spot, sigSize / 100);

      setStage(ar ? "جارٍ حفظ التوقيع…" : "Saving your signature…");
      const fileHash = fresh.isLast ? await sha256HexOfBuffer(bytes) : "";
      const res = await base44.functions.invoke("multiSign", {
        action: "submitSignature",
        token,
        newDocUrl: url,
        fileHash,
        lang: ar ? "ar" : "en",
      });
      setDone({ completed: res.data.completed, docUrl: url });
    } catch (err) {
      setError((ar ? "تعذّر التوقيع — " : "Couldn't sign — ") + (err?.response?.data?.error || err.message));
    } finally {
      setSigning(false);
      setStage("");
    }
  };

  const Shell = ({ children }) => <PublicSignShell ar={ar}>{children}</PublicSignShell>;

  if (notFound) {
    return (
      <Shell>
        {loadError ? (
          <>
            <p className="text-sm text-destructive font-body">
              {ar ? "تعذّر تحميل المستند — حدث خطأ مؤقت." : "Couldn't load the document — a temporary error occurred."}
            </p>
            <p className="text-xs text-muted-foreground font-body" dir="ltr">{loadError}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-body">
              {ar ? "إعادة المحاولة" : "Try again"}
            </button>
          </>
        ) : (
          <p className="text-sm text-destructive font-body">
            {ar
              ? "رابط التوقيع غير صالح أو منتهي — ربما أُلغي الطلب أو أُنشئ رابط أحدث. اطلب من المرسل إرسال طلب توقيع جديد."
              : "This signing link is invalid or expired — the request may have been cancelled or replaced. Ask the sender to send a new signature request."}
          </p>
        )}
      </Shell>
    );
  }
  if (!info) {
    return (
      <Shell>
        <p className="flex items-center gap-2 text-sm text-muted-foreground font-body">
          <Loader2 className="w-4 h-4 animate-spin" /> {ar ? "جارٍ تحميل المستند…" : "Loading the document…"}
        </p>
      </Shell>
    );
  }

  if (info.expiresAt && new Date(info.expiresAt).getTime() <= Date.now()) {
    return (
      <Shell>
        <p className="text-sm text-destructive font-body">
          {ar ? "انتهت صلاحية طلب التوقيع. اطلب من المرسل إنشاء طلب جديد." : "This signature request has expired. Ask the sender to create a new request."}
        </p>
      </Shell>
    );
  }

  if (info.signer.status === "pending" && !info.canSign) {
   return (
     <Shell>
       <p className="text-sm text-muted-foreground font-body">{ar ? "بانتظار توقيع الطرف السابق حسب ترتيب الطلب." : "Waiting for the previous signer in the request order."}</p>
       <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-foreground text-background text-xs font-body">{ar ? "تحديث الحالة" : "Refresh status"}</button>
     </Shell>
   );
  }

  if (done || info.signer.status === "signed") {
    const finalUrl = done?.docUrl || info.docUrl;
    const completed = done ? done.completed : info.status === "completed";
    return (
      <Shell>
        <p className="flex items-center gap-2 text-sm text-emerald-700 font-body">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {ar ? "تم تسجيل توقيعك بنجاح." : "Your signature has been recorded."}
        </p>
        {completed ? (
          <>
            <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 font-body">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              {ar ? "وقّع جميع الأطراف وسُجّلت بصمة الملف النهائية." : "All parties signed and the final fingerprint was registered."}
            </p>
            <a href={finalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-foreground text-background text-xs font-body">
              <Download className="w-3.5 h-3.5" /> {ar ? "تنزيل النسخة النهائية" : "Download final copy"}
            </a>
          </>
        ) : (
          <p className="text-xs text-muted-foreground font-body">
            {ar ? "بانتظار بقية الموقّعين — سيصل إشعار عند اكتمال الجميع." : "Waiting for the remaining signers — a notification is sent once everyone signs."}
          </p>
        )}
      </Shell>
    );
  }

  return (
    <Shell>
      <PublicSignSteps ar={ar} current={2} />
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <header className="flex flex-col gap-3 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><PenLine className="h-5 w-5 text-accent" />{ar ? "توقيع المستند" : "Sign the document"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{ar ? `${info.creatorName} أرسل إليك هذا المستند للتوقيع.` : `${info.creatorName} sent you this document to sign.`}</p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"><ShieldCheck className="h-3.5 w-3.5" />{info.signedCount}/{info.totalCount} {ar ? "توقيعات مكتملة" : "signatures complete"}</span>
        </header>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[0.85fr_1.4fr]">
          <aside className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{ar ? "المستند المطلوب" : "Requested document"}</p>
              <a href={info.docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 transition hover:border-accent/50">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary"><FileText className="h-5 w-5 text-accent" /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{info.fileName}</span><span className="mt-1 block text-[10px] text-muted-foreground">PDF · {ar ? "فتح ومعاينة" : "Open and preview"}</span></span>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
              </a>
            </div>

            <div className="rounded-xl border border-border bg-secondary/35 p-4">
              <p className="text-xs font-semibold">{ar ? "مكان التوقيع" : "Signature placement"}</p>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">
                {chosenSpot
                  ? (ar ? `المكان المختار في الصفحة ${chosenSpot.page}.` : `Selected placement on page ${chosenSpot.page}.`)
                  : info.signer.spot
                    ? (ar ? `المكان المقترح في الصفحة ${info.signer.spot.page}.` : `Suggested placement on page ${info.signer.spot.page}.`)
                    : (ar ? "اختر موضع توقيعك داخل المستند." : "Choose where your signature appears in the document.")}
              </p>
              <button onClick={() => setShowSpotPicker(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-accent/35 bg-card px-3 py-2 text-xs font-medium text-accent hover:bg-accent/5"><MousePointerClick className="h-4 w-4" />{chosenSpot ? (ar ? "تعديل المكان" : "Edit placement") : (ar ? "تحديد مكان التوقيع" : "Choose placement")}</button>
            </div>

            {info.verificationId && <div className="rounded-xl border border-accent/25 bg-accent/5 p-4"><p className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck className="h-4 w-4 text-accent" />{ar ? "رقم التحقق المشفّر" : "Encrypted verification ID"}</p><p dir="ltr" className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{info.verificationId}</p></div>}
          </aside>

          <div className="rounded-xl border border-border p-4 sm:p-5">
            <div className="mb-5"><p className="text-xs text-muted-foreground">{ar ? "الموقّع" : "Signer"}</p><h3 className="mt-1 font-heading text-xl font-semibold">{info.signer.name}</h3></div>
            <div className="mb-5 inline-flex rounded-xl border border-border bg-secondary/50 p-1">
              <button onClick={() => setMode("type")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${mode === "type" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}><Keyboard className="h-4 w-4" />{ar ? "كتابة الاسم" : "Type name"}</button>
              <button onClick={() => setMode("draw")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${mode === "draw" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground"}`}><PenLine className="h-4 w-4" />{ar ? "رسم التوقيع" : "Draw"}</button>
            </div>
            <div className="mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{ar ? "حجم التوقيع على المستند" : "Signature size on document"}</span><span dir="ltr">{sigSize}%</span></div>
              <input type="range" min={50} max={200} step={10} value={sigSize} onChange={(event) => setSigSize(Number(event.target.value))} className="w-full accent-current" />
            </div>
            {mode === "type" ? <TypedSignature ar={ar} defaultName={info.signer.name || ""} onSave={sign} saving={signing} /> : <SignaturePad ar={ar} onSave={sign} saving={signing} />}
            {signing && <p className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-accent" />{stage}</p>}
            {error && <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          </div>
        </div>
      </section>

      {showSpotPicker && <SignSpotPicker docUrl={info.docUrl} initialSpot={chosenSpot || info.signer.spot || null} initialScale={sigSize} signerName={info.signer.name} ar={ar} onConfirm={(spot, scale) => { setChosenSpot(spot); setSigSize(scale); setShowSpotPicker(false); }} onClose={() => setShowSpotPicker(false)} />}
    </Shell>
  );
}