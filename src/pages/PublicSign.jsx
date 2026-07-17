import React, { useEffect, useState } from "react";
import { PenLine, Loader2, FileText, ShieldCheck, Download, ExternalLink, CheckCircle2, Keyboard, MousePointerClick } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SignaturePad from "@/components/files/SignaturePad";
import SignSpotPicker from "@/components/files/SignSpotPicker";
import TypedSignature from "@/components/files/TypedSignature";
import Logo from "@/components/Logo";
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
      if (fresh.signer.status === "signed") throw new Error(ar ? "وقّعت هذا المستند مسبقًا." : "You already signed this document.");
      if (!fresh.canSign) throw new Error(ar ? "يجب اكتمال توقيع الطرف السابق أولًا." : "The previous signer must finish first.");

      setStage(ar ? "جارٍ ختم توقيعك على المستند…" : "Stamping your signature…");
      const stamp = await makeSignatureStamp(sigDataUrl, fresh.signer.name);
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

  const Shell = ({ children }) => (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={ar ? "rtl" : "ltr"}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Logo size={34} />
          <p className="font-heading font-semibold">PowerCare</p>
        </div>
        {children}
        {/* Conversion CTA — every external signer is a potential customer */}
        <div className="pt-4 border-t border-border text-center space-y-1.5">
          <p className="text-[11px] text-muted-foreground font-body">
            {ar ? "أعجبتك التجربة؟ وقّع مستنداتك أنت أيضًا مع أي شخص — بالعربية وبشهادة تحقق مشفّرة." : "Like this? Sign your own documents with anyone — with an encrypted verification badge."}
          </p>
          <a href="/pricing" className="inline-block text-xs font-body font-semibold text-accent hover:underline">
            {ar ? "ابدأ مجانًا مع PowerCare ←" : "Start free with PowerCare →"}
          </a>
        </div>
      </div>
    </div>
  );

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
      <div>
        <h1 className="font-heading text-xl font-semibold flex items-center gap-2">
          <PenLine className="w-5 h-5 text-accent" /> {ar ? "طلب توقيع" : "Signature request"}
        </h1>
        <p className="text-xs text-muted-foreground font-body mt-1">
          {ar
            ? `${info.creatorName} يطلب توقيعك على المستند التالي (${info.signedCount}/${info.totalCount} وقّعوا):`
            : `${info.creatorName} asked you to sign the following document (${info.signedCount}/${info.totalCount} signed):`}
        </p>
      </div>

      <a href={info.docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border hover:bg-muted text-xs font-body">
        <FileText className="w-4 h-4 text-accent shrink-0" />
        <span className="truncate flex-1">{info.fileName}</span>
        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </a>

      <div className="space-y-3">
        <p className="text-xs font-medium font-body">
          {ar ? `${info.signer.name} — أضف توقيعك هنا:` : `${info.signer.name} — add your signature here:`}
        </p>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[11px] text-muted-foreground font-body">
            {chosenSpot
              ? (ar ? `سيُوضع توقيعك في المكان الذي اخترته (صفحة ${chosenSpot.page}).` : `Your signature will be placed where you chose (page ${chosenSpot.page}).`)
              : info.signer.spot
                ? (ar ? `سيُوضع توقيعك في المكان المقترح (صفحة ${info.signer.spot.page}) — ويمكنك تغييره.` : `Your signature will be placed at the suggested spot (page ${info.signer.spot.page}) — you can change it.`)
                : (ar ? "يمكنك اختيار مكان توقيعك على المستند بنفسك." : "You can choose where your signature goes on the document.")}
          </p>
          <button
            onClick={() => setShowSpotPicker(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border border-border hover:bg-muted transition"
          >
            <MousePointerClick className="w-3.5 h-3.5 text-accent" />
            {chosenSpot ? (ar ? "تغيير مكان التوقيع" : "Change spot") : (ar ? "اختر مكان التوقيع" : "Pick signature spot")}
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode("type")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "type" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <Keyboard className="w-3.5 h-3.5" /> {ar ? "كتابة الاسم" : "Type name"}
          </button>
          <button
            onClick={() => setMode("draw")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-body border transition ${mode === "draw" ? "bg-foreground text-background border-foreground" : "border-border hover:bg-muted"}`}
          >
            <PenLine className="w-3.5 h-3.5" /> {ar ? "رسم التوقيع" : "Draw"}
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-body">
            <span>{ar ? "حجم التوقيع على المستند" : "Signature size on the document"}</span>
            <span dir="ltr">{sigSize}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={200}
            step={10}
            value={sigSize}
            onChange={(e) => setSigSize(Number(e.target.value))}
            className="w-full accent-current"
          />
        </div>
        {mode === "type" ? (
          <TypedSignature ar={ar} defaultName={info.signer.name || ""} onSave={sign} saving={signing} />
        ) : (
          <SignaturePad ar={ar} onSave={sign} saving={signing} />
        )}
      </div>

      {signing && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground font-body">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> {stage}
        </p>
      )}
      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      {showSpotPicker && (
        <SignSpotPicker
          docUrl={info.docUrl}
          initialSpot={chosenSpot || info.signer.spot || null}
          initialScale={sigSize}
          signerName={info.signer.name}
          ar={ar}
          onConfirm={(spot, scale) => { setChosenSpot(spot); setSigSize(scale); setShowSpotPicker(false); }}
          onClose={() => setShowSpotPicker(false)}
        />
      )}
    </Shell>
  );
}