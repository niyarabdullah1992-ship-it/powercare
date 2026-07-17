import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { makeSignatureStamp, stampOnPdf } from "@/lib/multiSignStamp";
import { loadBadgeQr } from "@/lib/verificationBadge";
import { sha256HexOfBuffer } from "@/lib/fileHash";
import { clampStampScale } from "@/lib/signatureStampGeometry";

export default function usePublicSigning() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const ar = (navigator.language || "").startsWith("ar");
  const [info, setInfo] = useState(null);
  const [failure, setFailure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [stage, setStage] = useState("");
  const [done, setDone] = useState(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("type");
  const [sigSize, setSigSize] = useState(100);
  const [chosenSpot, setChosenSpot] = useState(null);
  const [stampPreview, setStampPreview] = useState("");

  const load = async () => {
    setLoading(true); setFailure(null);
    if (!token) { setFailure({ type: "invalid" }); setLoading(false); return; }
    try {
      const response = await base44.functions.invoke("multiSign", { action: "getByToken", token });
      setInfo(response.data);
      if (response.data?.signer?.spot?.scale) setSigSize(clampStampScale(response.data.signer.spot.scale));
    } catch (err) {
      setFailure({ type: err?.response?.status === 404 ? "invalid" : "error", message: err?.response?.data?.error || err.message });
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [token]);

  const sign = async (sigDataUrl, isComposedStamp = false) => {
    setError(""); setSigning(true);
    try {
      setStage(ar ? "جارٍ تجهيز أحدث نسخة…" : "Fetching the latest version…");
      const fresh = (await base44.functions.invoke("multiSign", { action: "getByToken", token })).data;
      if (fresh.expiresAt && new Date(fresh.expiresAt).getTime() <= Date.now()) throw new Error(ar ? "انتهت صلاحية طلب التوقيع." : "This signature request has expired.");
      if (fresh.signer.status === "signed") throw new Error(ar ? "وقّعت هذا المستند مسبقًا." : "You already signed this document.");
      if (!fresh.canSign) throw new Error(ar ? "يجب اكتمال توقيع الطرف السابق أولًا." : "The previous signer must finish first.");
      setStage(ar ? "جارٍ ختم توقيعك على المستند…" : "Stamping your signature…");
      const stamp = isComposedStamp ? sigDataUrl : await makeSignatureStamp(sigDataUrl, fresh.signer.name, fresh.verificationId);
      let badge = null;
      if (fresh.isLast && fresh.verificationId) {
        const qr = await loadBadgeQr(fresh.verificationId).catch(() => null);
        badge = { sigId: fresh.verificationId, name: fresh.signerNames.slice(0, 60), qr };
      }
      const stamped = await stampOnPdf(fresh.docUrl, stamp, fresh.signedCount, badge, chosenSpot || fresh.signer.spot, sigSize / 100);
      setStage(ar ? "جارٍ حفظ التوقيع…" : "Saving your signature…");
      const fileHash = fresh.isLast ? await sha256HexOfBuffer(stamped.bytes) : "";
      const response = await base44.functions.invoke("multiSign", { action: "submitSignature", token, newDocUrl: stamped.url, fileHash, lang: ar ? "ar" : "en" });
      setDone({ completed: response.data.completed, docUrl: stamped.url, finalHash: response.data.finalHash || fileHash });
    } catch (err) {
      setError((ar ? "تعذّر التوقيع — " : "Couldn't sign — ") + (err?.response?.data?.error || err.message));
    } finally { setSigning(false); setStage(""); }
  };

  return { ar, info, failure, loading, signing, stage, done, error, mode, setMode, sigSize, setSigSize, chosenSpot, setChosenSpot, stampPreview, setStampPreview, sign, reload: load };
}